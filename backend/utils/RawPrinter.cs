using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Drawing.Printing;

namespace PizzaTownPrinter {
    public class RawPrinter {
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
        public class DOCINFOA {
            [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
            [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
            [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
        }

        [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

        [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool ClosePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

        [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool EndDocPrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool StartPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool EndPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

        public static string ResolvePrinterName(string requested) {
            // 1. If requested printer name is valid and currently available, use it!
            if (!string.IsNullOrEmpty(requested) && requested.ToLower() != "auto") {
                IntPtr h;
                if (OpenPrinter(requested.Normalize(), out h, IntPtr.Zero)) {
                    ClosePrinter(h);
                    return requested;
                }
            }

            // 2. Auto-detection: search for EPSON, TM-, WD8260, or any receipt printer in Windows spooler
            try {
                foreach (string p in PrinterSettings.InstalledPrinters) {
                    string lower = p.ToLower();
                    if (lower.Contains("epson") || lower.Contains("tm-") || lower.Contains("wd8260") || lower.Contains("receipt") || lower.Contains("thermal") || lower.Contains("pos")) {
                        Console.WriteLine("Auto-detected receipt printer: " + p);
                        return p;
                    }
                }

                // 3. Fallback: search for any non-virtual printer
                foreach (string p in PrinterSettings.InstalledPrinters) {
                    string lower = p.ToLower();
                    if (!lower.Contains("pdf") && !lower.Contains("onenote") && !lower.Contains("xps") && !lower.Contains("fax") && !lower.Contains("document")) {
                        Console.WriteLine("Fallback to printer: " + p);
                        return p;
                    }
                }
            } catch (Exception ex) {
                Console.Error.WriteLine("Error resolving printer name: " + ex.Message);
            }

            return requested;
        }

        public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes) {
            string actualPrinter = ResolvePrinterName(szPrinterName);
            IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
            Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
            IntPtr hPrinter = IntPtr.Zero;
            DOCINFOA di = new DOCINFOA();
            di.pDocName = "Pizza Town Receipt";
            di.pDataType = "RAW";

            bool bSuccess = false;
            if (OpenPrinter(actualPrinter, out hPrinter, IntPtr.Zero)) {
                if (StartDocPrinter(hPrinter, 1, di)) {
                    if (StartPagePrinter(hPrinter)) {
                        int dwWritten = 0;
                        bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                        EndPagePrinter(hPrinter);
                    }
                    EndDocPrinter(hPrinter);
                }
                ClosePrinter(hPrinter);
            }
            Marshal.FreeCoTaskMem(pUnmanagedBytes);
            if (!bSuccess) {
                int errorCode = Marshal.GetLastWin32Error();
                Console.Error.WriteLine("Error printing to '" + actualPrinter + "': Win32 error code " + errorCode);
            }
            return bSuccess;
        }

        public static int Main(string[] args) {
            if (args.Length < 1) {
                Console.Error.WriteLine("Usage: rawprint.exe <printer_name> [file_path]");
                Console.Error.WriteLine("Or pipe bytes to stdin.");
                return 1;
            }
            string printerName = args[0];
            byte[] bytes;

            if (args.Length >= 2 && File.Exists(args[1])) {
                bytes = File.ReadAllBytes(args[1]);
            } else {
                using (MemoryStream ms = new MemoryStream()) {
                    using (Stream stdin = Console.OpenStandardInput()) {
                        stdin.CopyTo(ms);
                    }
                    bytes = ms.ToArray();
                }
            }

            if (bytes.Length == 0) {
                Console.Error.WriteLine("No data to print.");
                return 2;
            }

            bool ok = SendBytesToPrinter(printerName, bytes);
            return ok ? 0 : 3;
        }
    }
}
