Any element:
1. data-context-menu-type (contextMenuType) - type of context menu (file, explorer, etc.);

File list (div):
1. data-readonly (readonly) - is user able to paste in current directory

File component (div):
1. data-filename (contextMenuAdditionalInfo) - filename;
2. data-filename-lowercased (contextMenuAdditionalInfoLowercased) - filename lowercased
3. `Requires data-context-menu-type === "file"` data-file-type (fileType) - type of file (disk | folder | file)
4. `Requires data-context-menu-type === "file" && data-file-type === "file"` data-file-subtype (fileSubtype) - subtype of file (undefined | image)
5. `Requires data-file-type === "file"` data-readonly (readonly) - is user able to paste in current directory

html tag:
1. data-path-to-copied-file (pathToCopiedFile) - path to copied file
1. data-copied-file (copiedFilename) - name to copied file/folder
2. data-clipboard-action (clipboardAction) - cutting or copying file
3. data-copied-file-type (copiedFileType) - type of copied file
