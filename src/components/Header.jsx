import React from 'react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 h-16 bg-zinc-900/80 backdrop-blur-xl rounded-2xl mt-4 mx-5 border border-white/10 shadow-[0px_10px_30px_rgba(204,255,0,0.15)]">
      <div className="flex items-center gap-4">
        <button className="active:scale-95 hover:scale-105 transition-all text-lime-400">
          <span className="material-symbols-outlined font-variation-settings-'FILL' 1" style={{ fontVariationSettings: "'FILL' 0" }}>menu</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black text-lime-400 font-lexend tracking-tighter uppercase leading-none">KINETIC</h1>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-0.5">Alex Rivers</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="active:scale-95 hover:scale-105 transition-all text-zinc-500">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="w-8 h-8 rounded-full border border-lime-400 overflow-hidden">
          <img 
            alt="Profile" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAW2Q0nBfn9Xx07pbIRfAc6Ghl9JwIrIJ53Gldh6ksdrpN0N8-jqzdazo_PCtQUytNT8Qacot3ON9SEPxKjzDwWxw7tfdPxP5eZXo4edUa0wVSpIWkIvOepsv1POU73Xar1LOG1iWAmNgG7qtlUFKLeTVMg3-zQ_WU_dMktXYKLlJOSt12xO5T0tUrgBT-nRuKgvdi67ylJ8cJbk4x-8gME8dMb5iYwVGyyaytejGrEqrH5g_LJmFsAwSBzoZcJen3EivlatL0tyHcM" 
          />
        </div>
      </div>
    </header>
  );
}
