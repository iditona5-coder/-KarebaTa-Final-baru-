<header className="flex items-center justify-between px-3 py-2 bg-white w-full">
  {/* KIRI */}
  <div className="flex items-center gap-2">
    <img
      src="/karebata-icon-80.png"
      className="w-10 h-10 flex-shrink-0"
      style={{width:40, height:40}}
      alt="K"
    />
    <div className="flex flex-col leading-none">
      <span className="font-black text-[18px] text-[#0A5C36]">Kareba'Ta</span>
      <span className="font-bold text-[10px] text-[#D4A017]">beritamu suaramu</span>
    </div>
  </div>

  {/* KANAN - INI KUNCINYA flex-shrink-0 */}
  <div className="flex items-center gap-4 flex-shrink-0">
    <Search size={22} />
    <Camera size={22} />
    <Image size={22} />
  </div>
</header>
