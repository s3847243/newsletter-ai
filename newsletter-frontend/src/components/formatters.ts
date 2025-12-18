// components/editor/formatters.ts
export const formatBold = () => {
  document.execCommand('bold', false);
};

export const formatItalic = () => {
  document.execCommand('italic', false);
};

export const formatStrike = () => {
  document.execCommand('strikeThrough', false);
};

export const formatBackquote = () => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  const selectedText = selection.toString();
  
  const code = document.createElement('code');
  code.className = 'inline-code';
  code.style.backgroundColor = '#f3f4f6';
  code.style.padding = '2px 6px';
  code.style.borderRadius = '4px';
  code.style.fontSize = '0.9em';
  code.style.fontFamily = 'monospace';
  code.textContent = selectedText || '`code`';
  
  range.deleteContents();
  range.insertNode(code);
  
  // Move cursor after the code element
  const newRange = document.createRange();
  newRange.setStartAfter(code);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
};

export const formatCodeBlock = (editorRef: React.RefObject<HTMLDivElement | null>) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  let node: Node | null = range.commonAncestorContainer;
  
  // Check if already inside a code block
  while (node && node !== editorRef.current) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.classList.contains('code-block') || el.tagName === 'PRE') {
        alert('Already inside a code block');
        return;
      }
      // Prevent code blocks in headings
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
        alert('Cannot add code block inside a heading');
        return;
      }
    }
    node = node.parentNode;
  }
  
  const selectedText = selection.toString();
  
  const pre = document.createElement('pre');
  pre.className = 'code-block';
  pre.style.backgroundColor = '#1e1e1e';
  pre.style.color = '#d4d4d4';
  pre.style.padding = '1em';
  pre.style.borderRadius = '8px';
  pre.style.overflow = 'auto';
  pre.style.fontFamily = 'monospace';
  pre.style.fontSize = '0.9em';
  pre.style.margin = '1em 0';
  pre.contentEditable = 'true';
  pre.textContent = selectedText || 'Write your code here...';
  
  range.deleteContents();
  range.insertNode(pre);
  
  // Add line breaks
  const br1 = document.createElement('br');
  const br2 = document.createElement('br');
  pre.parentNode?.insertBefore(br1, pre);
  pre.parentNode?.insertBefore(br2, pre.nextSibling);
  
  // Place cursor inside
  const newRange = document.createRange();
  newRange.selectNodeContents(pre);
  newRange.collapse(false);
  selection.removeAllRanges();
  selection.addRange(newRange);
};

export const formatList = () => {
  document.execCommand('insertUnorderedList', false);
};

export const formatChecklist = (editorRef: React.RefObject<HTMLDivElement | null>) => {
  if (!editorRef.current) return;
  
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  
  // Create checklist item
  const checklistItem = document.createElement('div');
  checklistItem.className = 'checklist-item';
  checklistItem.style.display = 'flex';
  checklistItem.style.alignItems = 'center';
  checklistItem.style.gap = '8px';
  checklistItem.style.margin = '4px 0';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.style.cursor = 'pointer';
  checkbox.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const text = target.nextElementSibling as HTMLElement;
    if (text) {
      text.style.textDecoration = target.checked ? 'line-through' : 'none';
      text.style.opacity = target.checked ? '0.6' : '1';
    }
  });
  
  const text = document.createElement('span');
  text.contentEditable = 'true';
  text.textContent = 'Todo item';
  text.style.flex = '1';
  
  checklistItem.appendChild(checkbox);
  checklistItem.appendChild(text);
  
  range.deleteContents();
  range.insertNode(checklistItem);
  
  // Add line break after
  const br = document.createElement('br');
  checklistItem.parentNode?.insertBefore(br, checklistItem.nextSibling);
  
  // Focus on the text
  const newRange = document.createRange();
  newRange.selectNodeContents(text);
  newRange.collapse(false);
  selection.removeAllRanges();
  selection.addRange(newRange);
};

export const insertDivider = (editorRef: React.RefObject<HTMLDivElement | null>) => {
  if (!editorRef.current) return;
  
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  
  const divider = document.createElement('hr');
  divider.style.border = 'none';
  divider.style.borderTop = '2px solid #e5e5e5';
  divider.style.margin = '2em 0';
  
  range.deleteContents();
  range.insertNode(divider);
  
  // Add paragraph after
  const p = document.createElement('p');
  p.innerHTML = '<br>';
  divider.parentNode?.insertBefore(p, divider.nextSibling);
  
  // Move cursor to new paragraph
  const newRange = document.createRange();
  newRange.setStart(p, 0);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
};

export const insertTable = (editorRef: React.RefObject<HTMLDivElement | null>) => {
  if (!editorRef.current) return;
  
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  
  // Create a 3x3 table
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.margin = '1em 0';
  
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  for (let i = 0; i < 3; i++) {
    const th = document.createElement('th');
    th.contentEditable = 'true';
    th.style.border = '1px solid #e5e5e5';
    th.style.padding = '8px';
    th.style.backgroundColor = '#f9fafb';
    th.style.fontWeight = '600';
    th.textContent = `Header ${i + 1}`;
    headerRow.appendChild(th);
  }
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  
  for (let row = 0; row < 2; row++) {
    const tr = document.createElement('tr');
    for (let col = 0; col < 3; col++) {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      td.style.border = '1px solid #e5e5e5';
      td.style.padding = '8px';
      td.textContent = 'Cell';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  
  table.appendChild(tbody);
  
  range.deleteContents();
  range.insertNode(table);
  
  // Add paragraph after
  const p = document.createElement('p');
  p.innerHTML = '<br>';
  table.parentNode?.insertBefore(p, table.nextSibling);
  
  // Focus first header cell
  const firstHeader = table.querySelector('th');
  if (firstHeader) {
    const newRange = document.createRange();
    newRange.selectNodeContents(firstHeader);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
};