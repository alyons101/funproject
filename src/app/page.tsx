import GoldPriceChart from "@/components/GoldPriceChart";
import AlertSignup from "@/components/AlertSignup";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-xs tracking-[0.2em] uppercase font-medium">Gold Tracker</h1>
          <span className="text-xs tracking-widest uppercase text-gray-400">XAU / USD</span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Hero */}
        <section>
          <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-2">
            Live Gold Spot Price
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-md">
            Real-time gold price per troy ounce in USD. Prices are fetched hourly
            and the chart updates every 5 minutes.
          </p>
        </section>

        {/* Chart section */}
        <section>
          <GoldPriceChart />
        </section>

        {/* Alert signup */}
        <section>
          <AlertSignup />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-20">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400 tracking-wide">
            © {new Date().getFullYear()} Gold Tracker
          </p>
          <p className="text-xs text-gray-400 tracking-wide">
            Prices sourced from{" "}
            <a
              href="https://metalpriceapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-black transition-colors"
            >
              MetalpriceAPI
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
