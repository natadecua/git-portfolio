# Automatic Rabbit Feeding System (ARFES)

![ARFES Schematic](https://raw.githubusercontent.com/natadecua/ARFES-Rabbit-Feeder/HEAD/images/ARFES_Schematic.png)

## Project Description

The Automatic Rabbit Feeding System (ARFES) is an embedded systems project designed to automate the feeding process for rabbits using a PIC microcontroller (PIC16F886). This system aims to help farmers manage rabbit feeding schedules more systematically and efficiently.

Users can configure the system via a 4x4 keypad to set:
1.  **Motor Speed:** Controls the speed of the DC geared motor (acting as a servo) using Pulse Width Modulation (PWM), regulating how fast the food is dispensed.
2.  **Running Time (Timer 1):** Determines how long the motor runs to dispense pellets.
3.  **Delay Time (Timer 2):** Sets the interval between feeding cycles.

The system provides feedback and prompts the user through a 16x2 LCD display.

**Author:** Nathanael Adrian T. Cua
**ID:** 12134945

## Features

*   Automated pellet dispensing for rabbits.
*   User-configurable motor speed (PWM controlled).
*   User-configurable feeding duration (Timer 1).
*   User-configurable delay between feedings (Timer 2).
*   4x4 Keypad for user input.
*   16x2 LCD for status display and user prompts.
*   Based on the PIC16F886 microcontroller.

## Hardware Components

*   **Microcontroller:** Microchip PIC16F886
*   **Display:** 16x02 Character LCD (e.g., WC1602A) with contrast potentiometer (RV1).
*   **Input:** 4x4 Matrix Keypad.
*   **Motor Driver:** L293D H-Bridge Motor Driver.
*   **Actuator:** DC Geared Motor (M1).
*   **Power Regulation:** LM7805 +5V Voltage Regulator.
*   **Oscillator:** Crystal Oscillator (Y1) with load capacitors (C1, C2).
*   **Passive Components:** Resistors (pull-ups for keypad rows, current limiting for LCD backlight), Capacitors (decoupling, timing).

**Schematic:** The detailed circuit diagram can be found in the `hardware/` directory:
*   [KiCad Schematic File](hardware/ARFES_Schematic.kicad_sch)
*   [Schematic PDF](hardware/ARFES_Schematic.pdf)

## Software (Firmware)

The firmware is written in C using the MikroC for PIC compiler.

*   **Location:** `firmware/` directory.
*   **Main File:** `arfes_main.c` (or your specific filename).
*   **Key Functions:**
    *   `Initialize_LCD()`: Sets up the LCD display.
    *   `Keypad_Init()`: Configures microcontroller pins for keypad scanning.
    *   `Keypad_Read()`: Scans the keypad and returns the pressed key.
    *   `Keypad_Get_Time()` / `Keypad_Get_Speed()`: Functions to read multi-digit numbers from the keypad for settings.
    *   `Display_*()` Functions: Various functions to show status/prompts on the LCD.
    *   `PWM1_Init()`, `PWM1_Start()`, `PWM1_Set_Duty()`, `PWM1_Stop()`: MikroC library functions used for PWM motor control.
    *   `main()`: Initializes hardware, enters the main loop to get user settings (Speed, Timer1, Timer2), controls the motor based on settings, and repeats.

**Control Logic:**
1.  Initialize LCD, Keypad, and PWM.
2.  Display start screen.
3.  Prompt user to enter Motor Speed (0-99%).
4.  Prompt user to enter Timer 1 duration (running time in seconds).
5.  Prompt user to enter Timer 2 duration (delay time in seconds).
6.  Display combined status.
7.  Start PWM output.
8.  Turn on motor using L293D (e.g., `motor_pin1 = 1`, `motor_pin2 = 0`).
9.  Wait for `delayTime1` seconds.
10. Turn off motor (`motor_pin1 = 0`, `motor_pin2 = 0`).
11. Stop PWM.
12. Wait for `delayTime2` seconds.
13. Repeat from step 2 (or step 7, depending on desired loop). *Note: The provided code loops back to getting input.*

## Repository Structure
├── firmware/ # MikroC source code
├── hardware/ # KiCad schematic files and PDF export
├── images/ # Images used in this README (schematic, optional photos)
├── .gitignore # Specifies intentionally untracked files that Git should ignore
├── LICENSE # Project license file (e.g., MIT)
└── README.md # This documentation file


## Setup and Building

1.  **Hardware:** Assemble the circuit according to the schematic in the `hardware/` directory.
2.  **Software Toolchain:** You need the MikroC for PIC compiler installed.
3.  **Building:**
    *   Open the MikroC project (or create one and add the `.c`/`.h` files from `firmware/`).
    *   Select the correct target device (PIC16F886).
    *   Configure the project settings (e.g., oscillator frequency based on your crystal - typically 8MHz or 20MHz for these projects).
    *   Build the project to generate the `.hex` file.
4.  **Programming:** Use a PIC programmer (like PICkit 3/4) and appropriate software (like MPLAB IPE) to flash the generated `.hex` file onto the PIC16F886 microcontroller.

## Future Improvements (Optional)

*   Implement a Real-Time Clock (RTC) module for scheduled feeding times instead of simple delays.
*   Add multiple feeding schedule slots.
*   Incorporate a sensor to detect low pellet levels.
*   Add EEPROM storage to save settings across power cycles.
*   Explore options for remote monitoring or control (e.g., using ESP8266/ESP32).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.