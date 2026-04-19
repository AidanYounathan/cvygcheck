import Link from "next/link";

export default function QRPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2]">
      <div className="flex flex-col items-center gap-10 px-6 text-center max-w-lg">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-light tracking-[0.2em] text-[#1B3664] uppercase">
            Scan to Check In
          </h1>
          <div className="w-16 h-px bg-[#C8A84B] mt-1" />
        </div>

        <div className="p-6 bg-white border border-[#E8E0D0] shadow-sm">
          <div className="w-56 h-56 bg-[#E8E0D0] flex items-center justify-center">
            <span className="text-xs tracking-wider text-[#6B6B6B] uppercase">
              QR Code
            </span>
          </div>
        </div>

        <p className="text-xs tracking-[0.2em] text-[#6B6B6B] uppercase">
          Point your camera at the code above
        </p>

        <Link
          href="/"
          className="text-xs tracking-[0.2em] text-[#1B3664] uppercase hover:text-[#C8A84B] transition-colors duration-300"
        >
          ← Back
        </Link>
      </div>
    </main>
  );
}
