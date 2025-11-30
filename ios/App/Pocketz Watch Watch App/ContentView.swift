//
//  ContentView.swift
//  Pocketz Watch Watch App
//
//  Created by Alex Polan on 11/30/25.
//

// Mostly AI generated tbh, I am not a SwiftUI expert :)
import SwiftUI
import WatchKit

struct Card: Identifiable, Hashable {
    let id: Int
    let name: String
    let bgColor: Color
    let textColor: Color
    let logo: String
    let barcodeValue: String
    let barcodeType: BarcodeType
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Card, rhs: Card) -> Bool {
        lhs.id == rhs.id
    }
}

enum BarcodeType {
    case code128
    case ean13
    case qrCode
}

struct ContentView: View {
    @State private var cards: [Card] = [
        Card(id: 1, name: "Starbucks", bgColor: Color(red: 0.0, green: 0.44, blue: 0.24), textColor: .white, logo: "☕", barcodeValue: "1234567890123", barcodeType: .ean13),
        Card(id: 2, name: "Amazon", bgColor: Color(red: 1.0, green: 0.6, blue: 0.0), textColor: .black, logo: "📦", barcodeValue: "9876543210987", barcodeType: .code128),
        Card(id: 3, name: "REWE", bgColor: Color(red: 0.8, green: 0.0, blue: 0.0), textColor: .white, logo: "🛒", barcodeValue: "5555555555555", barcodeType: .ean13),
        Card(id: 4, name: "IKEA", bgColor: Color(red: 0.0, green: 0.33, blue: 0.65), textColor: .yellow, logo: "🏠", barcodeValue: "3333333333333", barcodeType: .qrCode),
    ]
    
    var body: some View {
        NavigationStack {
            List(cards) { card in
                NavigationLink(value: card) {
                    CardRowView(card: card)
                }
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))
            }
            .listStyle(.carousel)
            .navigationTitle("Karten")
            .navigationDestination(for: Card.self) { card in
                CardDetailView(card: card)
            }
        }
    }
}

struct CardRowView: View {
    let card: Card
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(card.bgColor)
                    .frame(width: 44, height: 44)
                
                Text(card.logo)
                    .font(.system(size: 22))
            }
            
            Text(card.name)
                .font(.system(.body, design: .rounded, weight: .semibold))
                .foregroundColor(.primary)
                .lineLimit(1)
        }
        .padding(.vertical, 6)
    }
}

struct CardDetailView: View {
    let card: Card
    @State private var showFullscreen = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                CardHeaderView(card: card)
                
                BarcodeView(card: card)
                    .onTapGesture {
                        showFullscreen = true
                    }
                
                Text("Tippen für Vollbild")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 4)
        }
        .navigationTitle(card.name)
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(isPresented: $showFullscreen) {
            FullscreenBarcodeView(card: card, isPresented: $showFullscreen)
        }
    }
}

struct CardHeaderView: View {
    let card: Card
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(card.bgColor)
            
            VStack(spacing: 4) {
                Text(card.logo)
                    .font(.system(size: 28))
                
                Text(card.name)
                    .font(.system(.caption, design: .rounded, weight: .bold))
                    .foregroundColor(card.textColor)
            }
        }
        .frame(height: 70)
    }
}

struct BarcodeView: View {
    let card: Card
    
    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.white)
                
                switch card.barcodeType {
                case .qrCode:
                    QRCodeView(value: card.barcodeValue)
                        .padding(8)
                case .ean13, .code128:
                    BarcodePatternView(value: card.barcodeValue)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 10)
                }
            }
            .frame(height: card.barcodeType == .qrCode ? 80 : 55)
            
            Text(formatBarcodeNumber(card.barcodeValue))
                .font(.system(size: 10, weight: .medium, design: .monospaced))
                .foregroundColor(.secondary)
        }
    }
    
    func formatBarcodeNumber(_ value: String) -> String {
        var result = ""
        for (index, char) in value.enumerated() {
            if index > 0 && index % 4 == 0 {
                result += " "
            }
            result.append(char)
        }
        return result
    }
}

struct BarcodePatternView: View {
    let value: String
    
    var body: some View {
        GeometryReader { geometry in
            HStack(spacing: 0) {
                ForEach(generateBars(for: value, width: geometry.size.width), id: \.offset) { bar in
                    Rectangle()
                        .fill(bar.isBlack ? Color.black : Color.white)
                        .frame(width: bar.width)
                }
            }
        }
    }
    
    struct Bar: Identifiable {
        let offset: Int
        let isBlack: Bool
        let width: CGFloat
        
        var id: Int { offset }
    }
    
    func generateBars(for value: String, width: CGFloat) -> [Bar] {
        var bars: [Bar] = []
        let pattern = generatePattern(from: value)
        let totalUnits = pattern.reduce(0, +)
        let unitWidth = width / CGFloat(totalUnits)
        
        var offset = 0
        for (index, units) in pattern.enumerated() {
            bars.append(Bar(
                offset: offset,
                isBlack: index % 2 == 0,
                width: CGFloat(units) * unitWidth
            ))
            offset += 1
        }
        
        return bars
    }
    
    func generatePattern(from value: String) -> [Int] {
        var pattern: [Int] = [2, 1, 1]
        
        for char in value {
            let code = Int(char.asciiValue ?? 48) % 10
            pattern.append(1 + (code % 3))
            pattern.append(1 + ((code + 1) % 2))
            pattern.append(1 + ((code + 2) % 3))
            pattern.append(1 + (code % 2))
        }
        
        pattern.append(contentsOf: [1, 1, 2])
        return pattern
    }
}

struct QRCodeView: View {
    let value: String
    
    var body: some View {
        GeometryReader { geometry in
            let size = min(geometry.size.width, geometry.size.height)
            let moduleCount = 21
            let moduleSize = size / CGFloat(moduleCount)
            
            Canvas { context, _ in
                let pattern = generateQRPattern(from: value)
                
                for row in 0..<moduleCount {
                    for col in 0..<moduleCount {
                        if pattern[row][col] {
                            let rect = CGRect(
                                x: CGFloat(col) * moduleSize,
                                y: CGFloat(row) * moduleSize,
                                width: moduleSize + 0.5,
                                height: moduleSize + 0.5
                            )
                            context.fill(Path(rect), with: .color(.black))
                        }
                    }
                }
            }
            .frame(width: size, height: size)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
    
    func generateQRPattern(from value: String) -> [[Bool]] {
        let size = 21
        var pattern = Array(repeating: Array(repeating: false, count: size), count: size)
        
        addFinderPattern(&pattern, at: (0, 0))
        addFinderPattern(&pattern, at: (0, size - 7))
        addFinderPattern(&pattern, at: (size - 7, 0))
        
        for i in 8..<(size - 8) {
            pattern[6][i] = i % 2 == 0
            pattern[i][6] = i % 2 == 0
        }
        
        var hash = 0
        for char in value {
            hash = hash &* 31 &+ Int(char.asciiValue ?? 0)
        }
        
        for row in 0..<size {
            for col in 0..<size {
                if !isReserved(row: row, col: col, size: size) {
                    hash = hash &* 1103515245 &+ 12345
                    pattern[row][col] = (hash >> 16) % 3 != 0
                }
            }
        }
        
        return pattern
    }
    
    func addFinderPattern(_ pattern: inout [[Bool]], at pos: (Int, Int)) {
        let (startRow, startCol) = pos
        for r in 0..<7 {
            for c in 0..<7 {
                let row = startRow + r
                let col = startCol + c
                guard row < pattern.count && col < pattern[0].count else { continue }
                
                if r == 0 || r == 6 || c == 0 || c == 6 ||
                   (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
                    pattern[row][col] = true
                }
            }
        }
    }
    
    func isReserved(row: Int, col: Int, size: Int) -> Bool {
        if (row < 8 && col < 8) || (row < 8 && col >= size - 8) || (row >= size - 8 && col < 8) {
            return true
        }

        if row == 6 || col == 6 {
            return true
        }
        return false
    }
}

struct FullscreenBarcodeView: View {
    let card: Card
    @Binding var isPresented: Bool
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.white``
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    HStack {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.gray.opacity(0.6))
                        Text(card.name)
                            .font(.system(.caption, design: .rounded, weight: .semibold))
                            .foregroundColor(.black.opacity(0.7))
                    }
                    .padding(.top, 8)
                    
                    Spacer()
                    
                    Group {
                        switch card.barcodeType {
                        case .qrCode:
                            QRCodeView(value: card.barcodeValue)
                                .frame(width: geometry.size.width - 20, height: geometry.size.width - 20)
                        case .ean13, .code128:
                            VStack(spacing: 8) {
                                BarcodePatternView(value: card.barcodeValue)
                                    .frame(height: 70)
                                    .padding(.horizontal, 8)
                                
                                Text(card.barcodeValue)
                                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                                    .foregroundColor(.black)
                            }
                        }
                    }
                    
                    Spacer()
                }
                .padding(.horizontal, 10)
            }
            .onTapGesture {
                isPresented = false
            }
        }
        .onAppear {
            WKInterfaceDevice.current().play(.click)
        }
        .onDisappear {
            WKInterfaceDevice.current().play(.click)
        }
    }
}

#Preview {
    ContentView()
}
