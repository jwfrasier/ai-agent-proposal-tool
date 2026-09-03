// Usage: swift list-annots.swift in.pdf pageIndex
import Foundation
import PDFKit

let args = CommandLine.arguments
guard args.count >= 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])),
      let p = Int(args[2]), let page = doc.page(at: p) else { print("usage: list-annots.swift in.pdf page"); exit(1) }
for (i, a) in page.annotations.enumerated() {
    let b = a.bounds
    let c = (a.contents ?? "").replacingOccurrences(of: "\n", with: "\\n")
    print("[\(i)] type=\(a.type ?? "?") x=\(Int(b.origin.x)) y=\(Int(b.origin.y)) w=\(Int(b.width)) h=\(Int(b.height)) contents=\"\(c)\"")
}
