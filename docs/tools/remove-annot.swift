// Usage: swift remove-annot.swift in.pdf out.pdf pageIndex annotIndex [annotIndex...]
import Foundation
import PDFKit

let args = CommandLine.arguments
guard args.count >= 5, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])),
      let p = Int(args[3]), let page = doc.page(at: p) else { print("usage"); exit(1) }
let idxs = args[4...].compactMap { Int($0) }.sorted(by: >)
let annots = page.annotations
for i in idxs {
    guard i < annots.count else { print("index \(i) out of range"); exit(1) }
    print("removing [\(i)] \(annots[i].contents ?? "")")
    page.removeAnnotation(annots[i])
}
doc.write(to: URL(fileURLWithPath: args[2]))
print("wrote \(args[2])")
