# Perl Date-Based File Sorter for Linux

A Perl script designed to automate the sorting of files within a specified directory based on their last modification date, organizing them into date-stamped subdirectories. This script is based on the research paper "Date-based File Sorting Perl Script for Linux Operating Systems" by Cua, Castro, Mayor, and Sebastian from De La Salle University Manila.

## Abstract (from paper)

In the landscape of modern computing, efficient file management is crucial, particularly in environments generating large volumes of data. This script automates the sorting of files by modification date within Linux environments. The primary objective is to streamline file organization, reducing manual effort and minimizing the potential for human error. The script leverages Perl's robust capabilities to handle file operations, creating directories as needed and ensuring files are systematically categorized.

## Features

*   Sorts files based on their **last modification date**.
*   Prompts the user for the source (input) directory and the base destination (output) directory.
*   Automatically creates a base destination directory if it doesn't exist.
*   Automatically creates date-specific subdirectories (format: `YYYY-MM-DD`) within the base destination directory as needed.
*   Moves files from the source directory into the corresponding date subdirectory in the destination.
*   Includes error handling for:
    *   Non-existent source directories.
    *   Failure to create destination directories.
    *   Failure to read file modification times.
    *   Failure to move files.
*   Skips non-regular files (like directories or symbolic links) within the source directory.
*   Provides a summary report upon completion.

## Prerequisites

*   **Perl:** A working Perl interpreter (usually pre-installed on most Linux distributions).
*   **Standard Perl Modules:** `strict`, `warnings`, `File::Copy`, `File::Path`, `File::Basename`, `Time::Piece`. These are typically part of the standard Perl distribution.
*   **Linux/Unix-like Environment:** The script relies on Unix-style paths and file system operations.

## Installation

1.  **Download:** Download the `sort_files_by_date.pl` script to your local machine.
2.  **Make Executable (Optional but recommended):** Open your terminal and run:
    ```bash
    chmod +x sort_files_by_date.pl
    ```

## Usage

1.  Open your terminal.
2.  Navigate to the directory where you saved the script, OR provide the full path to the script.
3.  Run the script using:
    ```bash
    perl sort_files_by_date.pl
    ```
    or, if you made it executable:
    ```bash
    ./sort_files_by_date.pl
    ```
4.  The script will prompt you to enter:
    *   The **source directory** (the folder containing the files you want to sort).
    *   The **base destination directory** (the folder where the date-stamped subdirectories will be created).
5.  Press Enter after each input. The script will then process the files and report the results.

**Example:**

Use code with caution.
Markdown
$ ./sort_files_by_date.pl
Enter the source directory: /home/user/Downloads/unsorted_files
Enter the base destination directory: /home/user/Documents/sorted_archive
Processing files in '/home/user/Downloads/unsorted_files'...
Creating destination directory: '/home/user/Documents/sorted_archive/2024-06-19'
Creating destination directory: '/home/user/Documents/sorted_archive/2024-06-26'
Skipping '.hidden_dir': Not a regular file.
--- Sorting Complete ---
Source Directory: /home/user/Downloads/unsorted_files
Base Destination Directory: /home/user/Documents/sorted_archive
Files Moved: 5
Files Skipped: 1
Files have been sorted by modification date into corresponding subdirectories.


## Screenshots (Based on Figures from the Paper)

**Figure 1 & 2: Example Source Directory ('test') and its Contents**
![Test Folder Contents](https://raw.githubusercontent.com/natadecua/Date-based-Linux-Perl-File-sorter/HEAD/images/fig2_test_contents.png)
*(Caption: Shows the initial state of the 'test' directory containing various files.)*

**Figure 5 & 6: Running the Script and Completion**
![Running the Script](https://raw.githubusercontent.com/natadecua/Date-based-Linux-Perl-File-sorter/HEAD/images/fig5_running_script.png)
*(Caption: Shows the script execution in the terminal, prompting for input.)*

![Script Completion](https://raw.githubusercontent.com/natadecua/Date-based-Linux-Perl-File-sorter/HEAD/images/fig6_program_completion.png)
*(Caption: Shows the script's completion message after processing files.)*

**Figure 7 & 8: Resulting Destination Directory ('test_sorted') Structure**
![New Directory Folders](https://raw.githubusercontent.com/natadecua/Date-based-Linux-Perl-File-sorter/HEAD/images/fig7_new_directory_folders.png)
*(Caption: Shows the created date-based subdirectories within the destination folder.)*

![Files in Date Subdirectory](https://raw.githubusercontent.com/natadecua/Date-based-Linux-Perl-File-sorter/HEAD/images/fig8_new_directory_files.png)
*(Caption: Shows files moved into one of the date-specific subdirectories (e.g., 2024-06-19).)*

**Figure 9: Error Handling Example**
![Error Catching](https://raw.githubusercontent.com/natadecua/Date-based-Linux-Perl-File-sorter/HEAD/images/fig9_error_catching.png)
*(Caption: Demonstrates the script handling an error when a non-existent source directory is entered.)*

## How it Works

1.  **Initialization:** Loads necessary Perl modules.
2.  **Input:** Prompts the user for source and destination paths.
3.  **Validation:** Checks if the source directory exists. Creates the base destination directory if needed.
4.  **Iteration:** Opens the source directory and reads its contents one item at a time.
5.  **Filtering:** Skips special entries (`.` and `..`) and non-regular files.
6.  **Date Extraction:** Gets the last modification timestamp (`mtime`) for each regular file using `stat`.
7.  **Formatting:** Converts the timestamp to a `YYYY-MM-DD` string using `Time::Piece` and `strftime`.
8.  **Directory Creation:** Constructs the path for the date-specific subdirectory within the destination. Creates this subdirectory if it doesn't already exist using `File::Path::make_path`.
9.  **File Movement:** Moves the file from the source directory to the newly determined date-specific destination directory using `File::Copy::move`.
10. **Reporting:** Keeps track of moved and skipped files and prints a summary upon completion.

## Future Enhancements (Based on Paper Recommendations)

*   **Customizable Sorting Criteria:** Allow sorting by creation date, file type, size, etc.
*   **User-Defined Rules/Filters:** Implement pattern matching or metadata filtering.
*   **Advanced Directory Structure:** Support nested subdirectories (e.g., Year/Month/Day).
*   **Archiving Feature:** Option to move files older than a certain date to a separate archive location.
*   **Logging:** Implement a logging system to record all actions and errors to a file.
*   **GUI:** Develop a graphical user interface for ease of use.
*   **Configuration File:** Allow users to set preferences (date format, default paths, rules) via a config file.
*   **Parallel Processing:** Handle large directories more efficiently.
*   **Incremental Sorting:** Option to only sort new or modified files since the last run.
*   **Cloud Sync/Version Control Integration:** Add options to sync with cloud storage or integrate with systems like Git.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

*   Based on the research paper: "Date-based File Sorting Perl Script for Linux Operating Systems" by Nathanael Adrian T. Cua, Carlos Miguel M. Castro, Gabrielle Adlei N. Mayor, and James V. Sebastian, De La Salle University Manila.