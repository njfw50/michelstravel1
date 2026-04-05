import sys

with open(r"c:\Users\njfw2\michelstravel1\client\src\pages\SeniorTerminal.tsx", "r", encoding="utf-8") as f:
    text = f.read()

target1 = """            <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight text-balance">
              {(tripType === "round-trip" || tripType === "multi-city") && !selectedOutboundSlice 
                ? "Escolha o seu voo de IDA:" 
                : (tripType === "round-trip" || tripType === "multi-city") && selectedOutboundSlice
                ? "Ida selecionada! Agora escolha a VOLTA:"
                : "Escolha o voo de sua preferência:"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">"""

replacement1 = """            <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight text-balance">
              {(tripType === "round-trip" || tripType === "multi-city") && !selectedOutboundSlice 
                ? "Escolha o seu voo de IDA:" 
                : (tripType === "round-trip" || tripType === "multi-city") && selectedOutboundSlice
                ? "Ida Garantida! Agora escolha o voo da sua VOLTA:"
                : "Escolha o voo de sua preferência:"}
            </h2>

            {selectedOutboundSlice && (
               <div className="bg-slate-800/90 border-4 border-blue-500 rounded-[32px] p-6 lg:p-8 mb-8 text-left shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white rounded-bl-2xl px-6 py-2 font-bold text-xs sm:text-sm uppercase tracking-wider">
                     Sua Seleção de Ida (Concluída)
                  </div>
                  <div className="flex flex-col md:flex-row gap-6 sm:gap-10 items-center mt-2">
                     <div className="flex-1 w-full bg-slate-900/50 p-4 rounded-3xl border border-slate-700/50">
                        {displaySliceTimes(selectedOutboundSlice.slices[0], selectedOutboundSlice.slices[0].segments[0], selectedOutboundSlice.slices[0].segments[selectedOutboundSlice.slices[0].segments.length - 1], true)}
                     </div>
                     <div className="text-center md:text-right md:border-l-2 border-slate-700 md:pl-6 w-full md:w-auto">
                        <p className="text-slate-400 font-medium text-sm sm:text-base">Preço Total Estimado</p>
                        <p className="text-blue-400 font-black text-3xl sm:text-4xl capitalize truncate break-all">{selectedOutboundSlice.currency} {selectedOutboundSlice.price}</p>
                        <p className="text-slate-400 font-medium text-sm sm:text-base mt-2">Voando: {selectedOutboundSlice.airline}</p>
                     </div>
                  </div>
               </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">"""

target2 = """                  return (
                    <div key={flight.id || idx} className="bg-slate-800 flex flex-col rounded-3xl sm:rounded-[40px] p-6 sm:p-8 border-4 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)] gap-6">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-base sm:text-lg text-slate-400 font-medium">Companhia Aérea</p>
                          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 capitalize truncate">{flight.airline}</p>
                        </div>
                        {flight.logoUrl && <img src={flight.logoUrl} className="h-10 w-10 sm:h-12 sm:w-12 bg-white rounded-lg p-1" alt="Logo" />}
                      </div>"""

replacement2 = """                  return (
                    <div key={flight.id || idx} className="bg-slate-800 flex flex-col rounded-3xl sm:rounded-[40px] p-6 sm:p-8 border-4 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)] gap-6 relative overflow-hidden transition-transform hover:-translate-y-2">
                      
                      {(!selectedOutboundSlice && (tripType === "round-trip" || tripType === "multi-city")) && (
                         <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-bl-3xl font-extrabold uppercase tracking-widest text-xs sm:text-sm shadow-md">
                            Opções de Ida
                         </div>
                      )}
                      {(selectedOutboundSlice) && (
                         <div className="absolute top-0 right-0 bg-emerald-600 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-bl-3xl font-extrabold uppercase tracking-widest text-xs sm:text-sm shadow-md">
                            Opções de Volta
                         </div>
                      )}

                      <div className="flex justify-between items-start mt-4 sm:mt-2">
                        <div>
                          <p className="text-base sm:text-lg text-slate-400 font-medium">Companhia Aérea</p>
                          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 capitalize truncate" title={flight.airline}>{flight.airline}</p>
                        </div>
                        {flight.logoUrl && <img src={flight.logoUrl} className="h-10 w-10 sm:h-12 sm:w-12 bg-white rounded-xl p-1.5 shadow-sm" alt="Logo" />}
                      </div>"""

if target1 in text:
    text = text.replace(target1, replacement1)
    print("Replaced target 1")
else:
    print("Could not find target 1")

if target2 in text:
    text = text.replace(target2, replacement2)
    print("Replaced target 2")
else:
    print("Could not find target 2")

with open(r"c:\Users\njfw2\michelstravel1\client\src\pages\SeniorTerminal.tsx", "w", encoding="utf-8") as f:
    f.write(text)
print("Done writing")
