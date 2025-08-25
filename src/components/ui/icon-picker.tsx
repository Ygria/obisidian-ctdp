"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import * as LucideIcons from "lucide-react"

// 预定义颜色
const ICON_COLORS = [
  "#000000",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F59E0B",
]

const EMOJI_CATEGORIES = {
  表情: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
  ],
  手势: [
    "👋",
    "🤚",
    "🖐",
    "✋",
    "🖖",
    "👌",
    "🤏",
    "✌",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝",
    "👍",
    "👎",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
  ],
  活动: [
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🥎",
    "🎾",
    "🏐",
    "🏉",
    "🥏",
    "🎱",
    "🪀",
    "🏓",
    "🏸",
    "🏒",
    "🏑",
    "🥍",
    "🏏",
    "🪃",
    "🥅",
    "⛳",
    "🪁",
    "🏹",
    "🎣",
    "🤿",
    "🥊",
    "🥋",
    "🎽",
    "🛹",
    "🛷",
    "⛸",
  ],
  物品: [
    "⌚",
    "📱",
    "📲",
    "💻",
    "⌨",
    "🖥",
    "🖨",
    "🖱",
    "🖲",
    "🕹",
    "🗜",
    "💽",
    "💾",
    "💿",
    "📀",
    "📼",
    "📷",
    "📸",
    "📹",
    "🎥",
    "📽",
    "🎞",
    "📞",
    "☎",
    "📟",
    "📠",
    "📺",
    "📻",
    "🎙",
    "🎚",
  ],
  符号: [
    "❤",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "☮",
    "✝",
    "☪",
    "🕉",
    "☸",
    "✡",
    "🔯",
    "🕎",
    "☯",
    "☦",
    "🛐",
  ],
  自然: [
    "🌱",
    "🌿",
    "☘",
    "🍀",
    "🎍",
    "🎋",
    "🍃",
    "🍂",
    "🍁",
    "🍄",
    "🐚",
    "🌾",
    "💐",
    "🌷",
    "🌹",
    "🥀",
    "🌺",
    "🌸",
    "🌼",
    "🌻",
    "🌞",
    "🌝",
    "🌛",
    "🌜",
    "🌚",
    "🌕",
    "🌖",
    "🌗",
    "🌘",
    "🌑",
  ],
}

// 常用 Lucide 图标
const COMMON_LUCIDE_ICONS = [
  "Home",
  "User",
  "Settings",
  "Search",
  "Heart",
  "Star",
  "BookOpen",
  "Calendar",
  "Clock",
  "Mail",
  "Phone",
  "Camera",
  "Image",
  "File",
  "Folder",
  "Download",
  "Upload",
  "Edit",
  "Trash2",
  "Plus",
  "Minus",
  "Check",
  "X",
  "ChevronRight",
  "ChevronLeft",
  "ChevronUp",
  "ChevronDown",
  "ArrowRight",
  "ArrowLeft",
  "ArrowUp",
  "ArrowDown",
  "Play",
  "Pause",
  "Square",
  "Circle",
  "Triangle",
  "Zap",
  "Sun",
  "Moon",
  "Cloud",
  "Umbrella",
  "Coffee",
  "Gift",
  "Music",
  "Video",
  "Headphones",
  "Mic",
  "Volume2",
  "Wifi",
  "Battery",
  "Bluetooth",
  "Smartphone",
  "Laptop",
  "Monitor",
  "Printer",
  "Globe",
  "MapPin",
  "Navigation",
  "Compass",
  "Car",
  "Plane",
  "Train",
  "Bike",
  "Ship",
  "Rocket",
  "Building",
  "Store",
  "Bank",
]

interface IconPickerProps {
  value?: { type: "emoji" | "icon"; value: string; color?: string }
  onChange?: (icon: { type: "emoji" | "icon"; value: string; color?: string }) => void
  className?: string
}

export default function IconPicker({ value, onChange, className = "" }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"emoji" | "icon">("emoji")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<string>("表情")
  const [customEmoji, setCustomEmoji] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // 过滤图标
  const filteredIcons = COMMON_LUCIDE_ICONS.filter((iconName) =>
    iconName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const isValidEmoji = (str: string) => {
    const emojiRegex =
      /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]$/u
    return emojiRegex.test(str.trim())
  }

  const handleCustomEmojiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setCustomEmoji(input)

    // 如果输入的是有效的emoji，自动选择它
    if (input && isValidEmoji(input)) {
      handleEmojiSelect(input.trim())
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    onChange?.({ type: "emoji", value: emoji })
    setIsOpen(false)
    setCustomEmoji("")
  }

  const handleIconSelect = (iconName: string) => {
    onChange?.({ type: "icon", value: iconName, color: selectedColor })
    setIsOpen(false)
  }

  const renderIcon = () => {
    if (!value) {
      return <span style={{ fontSize: "24px" }}>📄</span>
    }

    if (value.type === "emoji") {
      return <span style={{ fontSize: "24px" }}>{value.value}</span>
    }

    if (value.type === "icon") {
      const IconComponent = LucideIcons[value.value as keyof typeof LucideIcons] as React.ComponentType<any>
      if (IconComponent) {
        return <IconComponent size={24} style={{ color: value.color || "#000000" }} />
      }
    }

    return <span style={{ fontSize: "24px" }}>📄</span>
  }

  const renderIconInGrid = (iconName: string, color: string) => {
    const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<any>
    if (IconComponent) {
      return <IconComponent size={20} style={{ color }} />
    }
    return null
  }

  return (
    <div className={`relative inline-block ${className}`} style={{ position: "relative", display: "inline-block" }}>
      {/* 触发按钮 */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "48px",
          height: "48px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#d1d5db"
          e.currentTarget.style.backgroundColor = "#f9fafb"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e5e7eb"
          e.currentTarget.style.backgroundColor = "white"
        }}
      >
        {renderIcon()}
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            marginTop: "8px",
            width: "320px",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            zIndex: 50,
          }}
        >
          {/* 标签页 */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
            <button
              onClick={() => setActiveTab("emoji")}
              style={{
                flex: 1,
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: "500",
                color: activeTab === "emoji" ? "#2563eb" : "#6b7280",
                borderBottom: activeTab === "emoji" ? "2px solid #2563eb" : "none",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Emoji
            </button>
            <button
              onClick={() => setActiveTab("icon")}
              style={{
                flex: 1,
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: "500",
                color: activeTab === "icon" ? "#2563eb" : "#6b7280",
                borderBottom: activeTab === "icon" ? "2px solid #2563eb" : "none",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              图标
            </button>
          </div>

          {activeTab === "emoji" && (
            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
              {/* 自定义 Emoji 输入框 */}
              <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>输入自定义 Emoji</div>
                <input
                  type="text"
                  placeholder="粘贴或输入 emoji..."
                  value={customEmoji}
                  onChange={handleCustomEmojiChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "16px",
                    outline: "none",
                    textAlign: "center",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#2563eb"
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                />
                {customEmoji && !isValidEmoji(customEmoji) && (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>请输入有效的 emoji</div>
                )}
              </div>

              {/* Emoji 分类导航 */}
              <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>或选择分类</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {Object.keys(EMOJI_CATEGORIES).map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveEmojiCategory(category)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "12px",
                        borderRadius: "4px",
                        border: "1px solid #e5e7eb",
                        backgroundColor: activeEmojiCategory === category ? "#eff6ff" : "white",
                        color: activeEmojiCategory === category ? "#2563eb" : "#6b7280",
                        cursor: "pointer",
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji 网格 */}
              <div style={{ padding: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "4px" }}>
                  {EMOJI_CATEGORIES[activeEmojiCategory as keyof typeof EMOJI_CATEGORIES]?.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      style={{
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        border: "none",
                        borderRadius: "4px",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f3f4f6"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 图标内容 */}
          {activeTab === "icon" && (
            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
              {/* 搜索框 */}
              <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
                <input
                  type="text"
                  placeholder="搜索图标..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#2563eb"
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                />
              </div>

              {/* 颜色选择器 */}
              <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>选择颜色</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {ICON_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        border: selectedColor === color ? "2px solid #2563eb" : "2px solid #e5e7eb",
                        backgroundColor: color,
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 图标网格 */}
              <div style={{ padding: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                  {filteredIcons.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => handleIconSelect(iconName)}
                      style={{
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        borderRadius: "4px",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      title={iconName}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f3f4f6"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      {renderIconInGrid(iconName, selectedColor)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



export const renderIcon = (icon: { type: "emoji" | "icon"; value: string; color?: string }) => {
  if (icon.type === "emoji") {
    return <span style={{ fontSize: "24px" }}>{icon.value}</span>
  } else if (icon.type === "icon") {
    const IconComponent = (LucideIcons as any)[icon.value]
    if (IconComponent) {
      return <IconComponent size={24} color={icon.color || "#000000"} />
    }
  }
  return <span style={{ fontSize: "24px" }}>📄</span>
}