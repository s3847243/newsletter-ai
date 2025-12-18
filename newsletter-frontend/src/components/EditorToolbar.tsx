import {
  Bold,
  Italic,
  List,
  Code,
  Link,
  Image,
  Strikethrough,
  CheckSquare,
  Minus,
  Table,
} from "lucide-react";
import { ToolbarButton } from "./ToolbarButton";
import { ToolbarDivider } from "./ToolbarDivider";

interface EditorToolbarProps {
  onFormatBold: () => void;
  onFormatItalic: () => void;
  onFormatStrike: () => void;
  onFormatCode: () => void;
  onFormatList: () => void;
  // onFormatChecklist: () => void;
  // onInsertLink: () => void;
  onInsertImage: () => void;
  onInsertDivider: () => void;
  onInsertTable: () => void;
}

export function EditorToolbar({
  onFormatBold,
  onFormatItalic,
  onFormatStrike,
  onFormatCode,
  onFormatList,
  onInsertImage,
  onInsertDivider,
  onInsertTable,
}: EditorToolbarProps) {
  return (
    <div className="sticky top-20 z-40 mt-6 flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-sm flex-wrap">
      {/* Text Formatting */}
      <ToolbarButton onClick={onFormatBold} icon={Bold} title="Bold (Ctrl+B)" />
      <ToolbarButton onClick={onFormatItalic} icon={Italic} title="Italic (Ctrl+I)" />
      <ToolbarButton onClick={onFormatStrike} icon={Strikethrough} title="Strikethrough" />
      
      <ToolbarDivider />
      
      {/* Lists */}
      <ToolbarButton onClick={onFormatList} icon={List} title="Bullet List" />
      {/* <ToolbarButton onClick={onFormatChecklist} icon={CheckSquare} title="Checklist" /> */}
      
      <ToolbarDivider />
      
      {/* Code & Links */}
      <ToolbarButton onClick={onFormatCode} icon={Code} title="Code Block" />
      {/* <ToolbarButton onClick={onInsertLink} icon={Link} title="Insert Link" /> */}
      
      <ToolbarDivider />
      
      {/* Media & Layout */}
      <ToolbarButton onClick={onInsertImage} icon={Image} title="Insert Image" />
      <ToolbarButton onClick={onInsertDivider} icon={Minus} title="Divider" />
      <ToolbarButton onClick={onInsertTable} icon={Table} title="Insert Table" />
    </div>
  );
}