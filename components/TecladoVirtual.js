"use client";

// Teclado gigante em ordem alfabética (mais fácil de achar a letra do que QWERTY
// para quem não tem prática de digitar). Usado para digitar placa, usuário e senha.
const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const NUMEROS = "0123456789".split("");

export default function TecladoVirtual({
  valor,
  onChange,
  maxLength = 8,
  somenteNumeros = false,
  onConfirmar,
  labelConfirmar = "CONFIRMAR",
}) {
  function adicionar(caractere) {
    if (valor.length >= maxLength) return;
    onChange((valor + caractere).toUpperCase());
  }

  function apagar() {
    onChange(valor.slice(0, -1));
  }

  function limpar() {
    onChange("");
  }

  const linha1 = LETRAS.slice(0, 13); // A–M
  const linha2 = LETRAS.slice(13); // N–Z

  return (
    <div className="w-full flex flex-col gap-6">
      {!somenteNumeros && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-2">
            {linha1.map((tecla) => (
              <button
                key={tecla}
                type="button"
                onClick={() => adicionar(tecla)}
                className="h-16 rounded-xl2 bg-surface text-ink text-2xl font-bold
                           border-2 border-white/10 active:bg-accent active:text-base
                           transition-colors"
              >
                {tecla}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-2">
            {linha2.map((tecla) => (
              <button
                key={tecla}
                type="button"
                onClick={() => adicionar(tecla)}
                className="h-16 rounded-xl2 bg-surface text-ink text-2xl font-bold
                           border-2 border-white/10 active:bg-accent active:text-base
                           transition-colors"
              >
                {tecla}
              </button>
            ))}
          </div>
        </div>
      )}

      {!somenteNumeros && <div className="h-px w-full bg-white/15" />}

      <div className="grid grid-cols-10 gap-2">
        {NUMEROS.map((tecla) => (
          <button
            key={tecla}
            type="button"
            onClick={() => adicionar(tecla)}
            className="h-16 rounded-xl2 bg-surface text-ink text-2xl font-bold
                       border-2 border-white/10 active:bg-accent active:text-base
                       transition-colors"
          >
            {tecla}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={limpar}
          className="h-20 rounded-xl2 bg-danger text-white text-2xl font-bold"
        >
          LIMPAR
        </button>
        <button
          type="button"
          onClick={apagar}
          className="h-20 rounded-xl2 bg-surface border-2 border-white/10 text-ink text-2xl font-bold"
        >
          ⌫ APAGAR
        </button>
        {onConfirmar && (
          <button
            type="button"
            onClick={onConfirmar}
            className="h-20 rounded-xl2 bg-accent2 text-white text-2xl font-bold"
          >
            {labelConfirmar}
          </button>
        )}
      </div>
    </div>
  );
}
