import React, { useState, useRef, useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import {
  $getRoot,
  $getSelection,
  EditorState,
  $createParagraphNode,
  $createTextNode,
} from "lexical";
import { $createListNode, ListNode, ListItemNode } from "@lexical/list";
import { $isRangeSelection } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  TextFormatType,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical";
import { $createHeadingNode, HeadingNode } from "@lexical/rich-text";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface LexicalEditorProps {
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  value?: string;
}

// 이모지 피커에서 이모지가 선택되었을 때의 타입 정의
interface EmojiData {
  id: string;
  name: string;
  native: string;
  shortcodes: string;
  keywords: string[];
}

// 이모지 피커 컴포넌트 (emoji-mart 사용)
function EmojiPicker({
  onEmojiSelect,
  onClose,
}: {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleEmojiSelect = (emojiData: EmojiData) => {
    onEmojiSelect(emojiData.native);
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      className="emoji-picker"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "white",
        border: "2px solid #e9ecef",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        zIndex: 9999,
        maxHeight: "400px",
        overflow: "hidden",
      }}
    >
      <Picker
        data={data}
        onEmojiSelect={handleEmojiSelect}
        theme="light"
        locale="ko"
        set="native"
        emojiSize={20}
        emojiButtonSize={28}
        maxFrequentRows={2}
        perLine={9}
        searchPosition="sticky"
        previewPosition="none"
        skinTonePosition="none"
      />
    </div>
  );
}

// 툴바 컴포넌트
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
    }
  }, []);

  React.useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1
    );
  }, [editor, updateToolbar]);

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const insertBulletList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createListNode("bullet"));
      }
    });
  };

  const insertCheckList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const listNode = $createListNode("check");
        $setBlocksType(selection, () => listNode);
      }
    });
  };

  const insertHeading = (headingSize: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const insertEmoji = (emoji: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText(emoji);
      }
    });
  };

  const undo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const redo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  const insertParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  return (
    <div
      className="text-toolbar"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        padding: "8px",
        borderBottom: "1px solid #ddd",
      }}
    >
      {/* 실행취소/다시실행 */}
      <button
        type="button"
        className="toolbar-btn"
        onClick={undo}
        title="실행취소"
        style={{ marginRight: "8px" }}
      >
        ↶
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={redo}
        title="다시실행"
        style={{ marginRight: "8px" }}
      >
        ↷
      </button>

      {/* 구분선 */}
      <div
        style={{
          width: "1px",
          height: "24px",
          backgroundColor: "#ddd",
          margin: "0 8px",
        }}
      />

      {/* 텍스트 포맷팅 */}
      <button
        type="button"
        className={`toolbar-btn ${isBold ? "active" : ""}`}
        onClick={() => formatText("bold")}
        title="굵게"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        className={`toolbar-btn ${isItalic ? "active" : ""}`}
        onClick={() => formatText("italic")}
        title="기울임"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        className={`toolbar-btn ${isUnderline ? "active" : ""}`}
        onClick={() => formatText("underline")}
        title="밑줄"
      >
        <u>U</u>
      </button>

      {/* 구분선 */}
      <div
        style={{
          width: "1px",
          height: "24px",
          backgroundColor: "#ddd",
          margin: "0 8px",
        }}
      />

      {/* 헤딩 */}
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => insertHeading("h1")}
        title="제목 1"
      >
        H1
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => insertHeading("h2")}
        title="제목 2"
      >
        H2
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => insertHeading("h3")}
        title="제목 3"
      >
        H3
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={insertParagraph}
        title="일반 텍스트"
      >
        P
      </button>

      {/* 구분선 */}
      <div
        style={{
          width: "1px",
          height: "24px",
          backgroundColor: "#ddd",
          margin: "0 8px",
        }}
      />

      {/* 리스트 */}
      <button
        type="button"
        className="toolbar-btn"
        onClick={insertBulletList}
        title="불릿 목록"
      >
        ••
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={insertCheckList}
        title="체크리스트"
      >
        ✓
      </button>

      {/* 구분선 */}
      <div
        style={{
          width: "1px",
          height: "24px",
          backgroundColor: "#ddd",
          margin: "0 8px",
        }}
      />

      {/* 이모지 */}
      <div style={{ position: "relative" }}>
        <button
          ref={emojiButtonRef}
          type="button"
          className="toolbar-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="이모지"
        >
          😊
        </button>
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiSelect={insertEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </div>
    </div>
  );
}

// 초기 에디터 상태 설정
function prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const paragraph = $createParagraphNode();
    root.append(paragraph);
  }
}

// 외부 값 동기화 플러그인
function ValueSyncPlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (value !== undefined) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(value));
        root.append(paragraph);
      });
    }
  }, [editor, value]);

  return null;
}

export const LexicalEditor: React.FC<LexicalEditorProps> = ({
  onChange,
  placeholder = "할 일을 입력하세요...",
  onFocus,
  onBlur,
  className = "",
  value = "",
}) => {
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  const initialConfig = {
    namespace: "TodoEditor",
    theme: {
      text: {
        bold: "editor-text-bold",
        italic: "editor-text-italic",
        underline: "editor-text-underline",
      },
      list: {
        nested: {
          listitem: "editor-nested-listitem",
        },
        ol: "editor-list-ol",
        ul: "editor-list-ul",
        listitem: "editor-listitem",
        listitemChecked: "editor-listitem-checked",
        listitemUnchecked: "editor-listitem-unchecked",
      },
      heading: {
        h1: "editor-heading-h1",
        h2: "editor-heading-h2",
        h3: "editor-heading-h3",
      },
    },
    onError: (error: Error) => {
      console.error("Lexical Editor Error:", error);
    },
    editorState: prepopulatedRichText,
    nodes: [ListNode, ListItemNode, HeadingNode],
  };

  const handleEditorChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      onChange(textContent);
    });
  };

  const handleFocus = () => {
    setIsEditorFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsEditorFocused(false);
    onBlur?.();
  };

  return (
    <div className={`enhanced-text-editor ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div
          className={`editor-container ${isEditorFocused ? "focused" : ""}`}
          style={{ position: "relative" }}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="enhanced-textarea"
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{
                  minHeight: "100px",
                  padding: "8px",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              />
            }
            placeholder={
              <div
                className="editor-placeholder"
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "8px",
                  color: "#999",
                  pointerEvents: "none",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  whiteSpace: "pre-line",
                }}
              >
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleEditorChange} />
          <HistoryPlugin />
          <ListPlugin />
          <ValueSyncPlugin value={value} />
        </div>
      </LexicalComposer>
    </div>
  );
};
