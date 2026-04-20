"""
給与支給控除一覧PDF → JSON テーブル抽出スクリプト
pdfplumber を使用してPDFの表構造を正確に読み取る

使い方: python parse_payroll.py <input.pdf>
出力:   JSON を stdout に出力
"""
import sys
import json
import pdfplumber

def extract_tables(pdf_path: str) -> list[list[list[str]]]:
    """
    PDFの全ページからテーブルを抽出し、ページごとの2D配列で返す。
    空白セルは空文字列として保持。
    """
    all_pages = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            # テーブル抽出（pdfplumberの自動検出）
            tables = page.extract_tables({
                "vertical_strategy": "lines",
                "horizontal_strategy": "lines",
                "snap_tolerance": 5,
                "join_tolerance": 5,
                "edge_min_length": 10,
            })

            if not tables:
                # テーブルが検出されない場合、テキスト行のフォールバック
                tables = page.extract_tables({
                    "vertical_strategy": "text",
                    "horizontal_strategy": "text",
                    "snap_tolerance": 5,
                    "join_tolerance": 5,
                })

            page_rows = []
            for table in tables:
                for row in table:
                    # 各セルをクリーンアップ（None → 空文字、改行除去）
                    cleaned = []
                    for cell in row:
                        if cell is None:
                            cleaned.append("")
                        else:
                            cleaned.append(cell.replace("\n", " ").strip())
                    page_rows.append(cleaned)

            if page_rows:
                all_pages.append(page_rows)

    return all_pages

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "PDF file path required"}), file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]

    try:
        pages = extract_tables(pdf_path)
        result = {
            "pages": pages,
            "totalPages": len(pages),
            "totalRows": sum(len(p) for p in pages),
        }
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
