// Usage: swift stamp-pdf.swift in.pdf out.pdf page,x,y,size,text [more stamps...]
// Coordinates in PDF points, origin bottom-left, Letter = 612x792.
import Foundation
import PDFKit
import AppKit

let args = CommandLine.arguments
guard args.count >= 4, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
    print("usage: stamp-pdf.swift in.pdf out.pdf page,x,y,size,text ..."); exit(1)
}
for spec in args[3...] {
    let parts = spec.split(separator: ",", maxSplits: 4).map(String.init)
    guard parts.count == 5, let p = Int(parts[0]), let x = Double(parts[1]),
          let y = Double(parts[2]), let size = Double(parts[3]),
          let page = doc.page(at: p) else { print("bad spec: \(spec)"); exit(1) }
    let text = parts[4]
    let bounds = CGRect(x: x, y: y, width: 530, height: size + 6)
    let annot = PDFAnnotation(bounds: bounds, forType: .freeText, withProperties: nil)
    annot.contents = text
    annot.font = NSFont(name: "Helvetica", size: size)
    annot.fontColor = .black
    annot.color = .clear
    annot.backgroundColor = .clear
    page.addAnnotation(annot)
}
doc.write(to: URL(fileURLWithPath: args[2]))
print("wrote \(args[2])")
