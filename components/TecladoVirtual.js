"use client";

// Teclado gigante em ordem alfabética
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

  const linha1 = LETRAS.slice(0, 13); // A - M
  const linha2 = LETRAS.slice(13); // N - Z

const teclaClass =
  "w-20 h-24 rounded-xl2 bg-surface text-4xl font-bold text-ink border-2 border-white/10 active:bg-accent active:text-white transition-colors";

  return (
    <div className="space-y-4">

      {!somenteNumeros && (
        <>
          {/* A até M */}
<div className="flex justify-center gap-2">
  {linha1.map((tecla) => (
    <button
      key={tecla}
      type="button"
      onClick={() => adicionar(tecla)}
      className={teclaClass}
    >
      {tecla}
    </button>
  ))}
</div>

          {/* N até Z */}
<div className="flex justify-center gap-2">
  {linha2.map((tecla) => (
    <button
      key={tecla}
      type="button"
      onClick={() => adicionar(tecla)}
      className={teclaClass}
    >
      {tecla}
    </button>
  ))}
</div>
        </>
      )}

      {!somenteNumeros && (
        <div className="h-px w-full bg-white/15" />
      )}

      {/* Números */}
<div className="flex justify-center gap-2">
  {NUMEROS.map((tecla) => (
    <button
      key={tecla}
      type="button"
      onClick={() => adicionar(tecla)}
      className={teclaClass}
    >
      {tecla}
    </button>
  ))}
</div>

      {/* Botões inferiores */}
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
          className="h-20 rounded-xl2 bg-surface border-2 border-white/10 text-2xl font-bold text-ink"
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
