TODO:

-   [ ] Files view
    -   [x] List displaying
    -   [x] Actions on click on item
        -   [x] directory
        -   [x] disk
        -   [x] file
    -   [ ] Different file list appearance
    -   [ ] Files Sorting
    -   [ ] Files grouping
    -   [ ] Navigation through list using arrow keys
    -   [ ] If no element is focused, focus on the element that starts with the entered letters
    -   [ ] Extended icons for files - ?
        -   [ ] Icons with file extensions - ?
        -   [ ] Unique icons for specific files - ?
-   [x] Navbar
    -   [x] Path Input
        -   [x] Finish styles
        -   [x] Path splitting in path input cover
    -   [x] Navigation Buttons
    -   [x] Reload window Button
    -   [x] Move to parent directory button
-   [x] Frame
    -   [x] Window Controls
-   [ ] Explorer history
    -   [ ] Limit length of history - ?
-   [ ] Interaction with filesystem
    -   [x] Open file
    -   [x] Delete file
        -   [x] Move to trash
        -   [x] Permanently delete
    -   [x] Rename file
    -   [x] Copy/cut file
        -   [ ] Frontend
            -   [x] Interface
            -   [ ] Algorithm
        -   [ ] Backend
            -   [x] Copy file
            -   [x] Move file
            -   [ ] Copy directory
            -   [ ] Move Directory
    -   [ ] Create file/directory
    -   [x] Watch changes in current directory
    -   [ ] symlinks
-   [ ] App Config
-   [ ] Settings
-   [ ] Localization
-   [x] Context Menu
-   [ ] Side Menu
-   [ ] Drag and drop
-   [ ] Custom scrollbar
-   [ ] Hotkeys
-   [ ] Customization
-   [ ] Error Notifications
    - [ ] Call notifications on every error
-   [ ] Search files in file system
-   [ ] 
-   [ ] Tests
-   [ ] Interactivity
    -   [ ] Show loader while dir is scanning
    -   [ ] Show loader while file is opening
-   [ ] Integration in system
    -   [ ] Button in native explorer context menu
    -   [ ] CLI
-   [ ] Handle empty path
-   [ ] Track all long-term actions
    -   [x] File copying/moving
    -   [ ] Folder copying/moving/deleting(if not empty)

BUGS:

1. [x] Maximizing/restoring to window doesn't change icon in middle window control button 
2. [ ] Path input form submit with empty input value path checker says that path does'nt exist
3. [x] When a button labeled 'cancel' is pressed in the file copying tracker, the confirmation menu for file deletion is skipped