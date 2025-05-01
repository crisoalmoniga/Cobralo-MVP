async function obtenerTasasDeCambio() {
  try {
    const res = await fetch("https://api.exchangerate.host/latest?base=ARS&symbols=USD,EUR");
    const data = await res.json();
    return {
      ARS: 1,
      USD: data.rates.USD,
      EUR: data.rates.EUR
    };
  } catch (error) {
    console.error("❌ Error al obtener las tasas de cambio:", error);
    return {
      ARS: 1,
      USD: 1050,
      EUR: 1150
    };
  }
}

function mostrarCamposPeriodo() {
  const periodoSelect = document.getElementById('periodo');
  if (!periodoSelect) return;

  const periodo = periodoSelect.value;
  const container = document.getElementById('camposPeriodo');
  if (!container) return;
  container.innerHTML = '';

  if (periodo === 'proyecto') {
    container.innerHTML += `
      <label>Fecha de inicio del proyecto:<br>
        <input type="date" id="fechaInicio" onchange="actualizarFechaFinMin(); this.blur()">
      </label>`;
    container.innerHTML += `
      <label>Fecha de finalización del proyecto:<br>
        <input type="date" id="fechaFin" onchange="this.blur()">
      </label>`;
    container.innerHTML += `
      <label>Horas estimadas por día de trabajo:
        <input type="number" id="horasDiariasProyecto">
      </label>`;
  }

  if (periodo === 'evento') {
    container.innerHTML += `
      <label>Horas estimadas del evento:
        <input type="number" id="horasEvento">
      </label>`;
  }
}

function actualizarFechaFinMin() {
  const inicio = document.getElementById('fechaInicio');
  const fin = document.getElementById('fechaFin');
  if (inicio && fin) {
    fin.min = inicio.value;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const periodoSelect = document.getElementById('periodo');
  if (periodoSelect) {
    mostrarCamposPeriodo();
    periodoSelect.addEventListener('change', mostrarCamposPeriodo);
  }
});

async function calcularCobro() {
  console.log("funcionando");

  const montoDeseado = parseFloat(document.getElementById('ingresos')?.value || 0);
  const gastos = parseFloat(document.getElementById('gastos')?.value || 0);
  const impuestos = parseFloat(document.getElementById('impuestos')?.value || 0);
  const experiencia = parseFloat(document.getElementById('experiencia')?.value || 0);
  const ajusteCliente = parseFloat(document.getElementById('cliente')?.value || 0);
  const periodo = document.getElementById('periodo')?.value;

  const monedaPrincipal = document.getElementById('monedaPrincipal')?.value || 'ARS';
  const monedaSecundaria = document.getElementById('monedaSecundaria')?.value;

  const tasasCambio = await obtenerTasasDeCambio();
  document.getElementById('tasaCambioInfo').innerText =
    `💱 Tasas actualizadas (ARS → USD: ${tasasCambio.USD.toFixed(2)}, EUR: ${tasasCambio.EUR.toFixed(2)})`;

  const convertir = (valorARS, monedaDestino) => valorARS / tasasCambio[monedaDestino];
  const simbolo = monedaPrincipal === 'USD' ? 'US$' : (monedaPrincipal === 'EUR' ? '€' : '$');
  const simboloSec = monedaSecundaria === 'USD' ? 'US$' : (monedaSecundaria === 'EUR' ? '€' : '$');

  if (!periodo) {
    alert("⚠️ No se pudo obtener el tipo de período de trabajo. Verificá el formulario.");
    return;
  }

  if (periodo === 'proyecto') {
    const fechaInicioInput = document.getElementById('fechaInicio')?.value;
    const fechaFinInput = document.getElementById('fechaFin')?.value;

    if (!fechaInicioInput || !fechaFinInput) {
      alert("📅 Por favor ingresá ambas fechas del proyecto.");
      return;
    }

    const fechaInicio = new Date(fechaInicioInput);
    const fechaFin = new Date(fechaFinInput);

    if (fechaFin < fechaInicio) {
      alert("⚠️ La fecha de finalización no puede ser anterior a la de inicio.");
      return;
    }

    const horasDiariasProyecto = parseFloat(document.getElementById('horasDiariasProyecto')?.value || 0);
    if (horasDiariasProyecto <= 0) {
      alert("⏱️ Ingresá una cantidad válida de horas por día.");
      return;
    }

    // Calcular días hábiles del proyecto
    let diasHabilesProyecto = 0;
    let fecha = new Date(fechaInicio);
    while (fecha <= fechaFin) {
      const dia = fecha.getDay();
      if (dia !== 0 && dia !== 6) diasHabilesProyecto++;
      fecha.setDate(fecha.getDate() + 1);
    }

    const horasTotales = diasHabilesProyecto * horasDiariasProyecto;
    if (horasTotales <= 0) {
      alert("⏱️ El proyecto no tiene horas hábiles válidas.");
      return;
    }

    // Calcular días hábiles del mes
    const anio = fechaInicio.getFullYear();
    const mes = fechaInicio.getMonth();
    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);
    let diasHabilesMes = 0;
    let fechaMes = new Date(primerDiaMes);
    while (fechaMes <= ultimoDiaMes) {
      const dia = fechaMes.getDay();
      if (dia !== 0 && dia !== 6) diasHabilesMes++;
      fechaMes.setDate(fechaMes.getDate() + 1);
    }

    if (diasHabilesMes === 0) {
      alert("🗓️ No se detectaron días hábiles en el mes. Revisá la fecha.");
      return;
    }

    // Calcular precios
    const gastosProporcionales = (gastos / diasHabilesMes) * diasHabilesProyecto;
    const gananciaProporcional = (montoDeseado / diasHabilesMes) * diasHabilesProyecto;
    const totalProporcional = gastosProporcionales + gananciaProporcional;

    const precioHoraBase = totalProporcional / horasTotales;
    const conImpuestos = precioHoraBase * (1 + impuestos / 100);
    const conExperiencia = conImpuestos * (1 + experiencia / 100);
    const ajustadoCliente = conExperiencia * (1 + ajusteCliente / 100);
    const precioTotal = ajustadoCliente * horasTotales;

    const precioHoraConvertida = convertir(ajustadoCliente, monedaPrincipal);
    const totalConvertido = convertir(precioTotal, monedaPrincipal);

    let textoSecundario = '';
    if (monedaSecundaria && monedaSecundaria !== monedaPrincipal) {
      const secundarioHora = convertir(ajustadoCliente, monedaSecundaria);
      const secundarioTotal = convertir(precioTotal, monedaSecundaria);
      textoSecundario = `
        <br>
        <small style="color: lightgray;">
          (${simboloSec}${secundarioHora.toFixed(2)} por hora – Total: ${simboloSec}${secundarioTotal.toFixed(2)})
        </small>`;
    }

    document.getElementById('precioHora').innerHTML = `
      <strong>💰 Precio por hora sugerido:</strong>
      <span style="font-size: 1.2em; color: darkgreen;">${simbolo}${precioHoraConvertida.toFixed(2)}</span>
      ${textoSecundario}
      <br>
      <strong>📆 Total de horas estimadas del proyecto:</strong>
      <span style="color: teal;">${horasTotales} hs</span><br>
      <strong>💼 Precio total del proyecto:</strong>
      <span style="font-size: 1.4em; color: navy;">${simbolo}${totalConvertido.toFixed(2)}</span>
    `;

    document.getElementById('detalle').innerHTML = `
      <small>📌 Cálculo basado en gastos y ganancias prorrateadas por días hábiles del mes (<strong>${diasHabilesMes}</strong>) y del proyecto (<strong>${diasHabilesProyecto}</strong>). Ajustes aplicados: experiencia <strong>${experiencia}%</strong>, cliente <strong>${ajusteCliente}%</strong>.</small>
    `;

    document.getElementById('resultado').style.display = 'block';
  }
}