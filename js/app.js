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

function calcularCobro() {
  const montoDeseado = parseFloat(document.getElementById('ingresos')?.value || 0);
  const gastos = parseFloat(document.getElementById('gastos')?.value || 0);
  const impuestos = parseFloat(document.getElementById('impuestos')?.value || 0);
  const experiencia = parseFloat(document.getElementById('experiencia')?.value || 0);
  const ajusteCliente = parseFloat(document.getElementById('cliente')?.value || 0);
  const periodo = document.getElementById('periodo')?.value;

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

    // Días hábiles del proyecto
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

    // Días hábiles del mes
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

    // Nuevo cálculo proporcional por hora
    const gastosProporcionales = (gastos / diasHabilesMes) * diasHabilesProyecto;
    const gananciaProporcional = (montoDeseado / diasHabilesMes) * diasHabilesProyecto;
    const totalProporcional = gastosProporcionales + gananciaProporcional;

    const precioHoraBase = totalProporcional / horasTotales;
    const conImpuestos = precioHoraBase * (1 + impuestos / 100);
    const conExperiencia = conImpuestos * (1 + experiencia / 100);
    const ajustadoCliente = conExperiencia * (1 + ajusteCliente / 100);
    const precioTotalProyecto = ajustadoCliente * horasTotales;

    document.getElementById('precioHora').innerHTML = `
      <strong>💰 Precio por hora sugerido:</strong>
      <span style="font-size: 1.2em; color: darkgreen;">$${ajustadoCliente.toFixed(2)}</span><br>
      <strong>📆 Total de horas estimadas del proyecto:</strong>
      <span style="color: teal;">${horasTotales} hs</span><br>
      <strong>💼 Precio total del proyecto:</strong>
      <span style="font-size: 1.4em; color: navy;">$${precioTotalProyecto.toFixed(2)}</span>
    `;

    document.getElementById('detalle').innerHTML = `
      <small>📌 Cálculo basado en gastos y ganancias prorrateadas por días hábiles del mes (<strong>${diasHabilesMes}</strong>) y del proyecto (<strong>${diasHabilesProyecto}</strong>). Ajustes aplicados: experiencia <strong>${experiencia}%</strong>, cliente <strong>${ajusteCliente}%</strong>.</small>
    `;

    document.getElementById('resultado').style.display = 'block';
    return;
  }

  if (periodo === 'evento') {
    const horasEvento = parseFloat(document.getElementById('horasEvento')?.value || 0);
    if (horasEvento <= 0) {
      alert("🎯 Ingresá una cantidad válida de horas estimadas para el evento.");
      return;
    }

    const totalMensualNecesario = montoDeseado + gastos;
    const conImpuestos = totalMensualNecesario * (1 + impuestos / 100);
    const precioBaseHora = conImpuestos / horasEvento;
    const conExperiencia = precioBaseHora * (1 + experiencia / 100);
    const ajustadoCliente = conExperiencia * (1 + ajusteCliente / 100);
    const precioTotalEvento = ajustadoCliente * horasEvento;

    document.getElementById('precioHora').innerHTML = `
      <strong>💰 Precio por hora:</strong>
      <span style="font-size: 1.2em; color: darkgreen;">$${ajustadoCliente.toFixed(2)}</span><br>
      <strong>🎉 Precio total del evento:</strong>
      <span style="font-size: 1.4em; color: navy;">$${precioTotalEvento.toFixed(2)}</span>
    `;

    document.getElementById('detalle').innerHTML = `
      <small>📌 Cálculo directo en base a las horas del evento. Ajustes aplicados: experiencia <strong>${experiencia}%</strong>, cliente <strong>${ajusteCliente}%</strong>.</small>
    `;

    document.getElementById('resultado').style.display = 'block';
    return;
  }

  if (periodo === 'hora') {
    const totalMensualNecesario = montoDeseado / 0.5;
    const conImpuestos = totalMensualNecesario * (1 + impuestos / 100);
    const precioBaseHora = conImpuestos / 132;
    const conExperiencia = precioBaseHora * (1 + experiencia / 100);
    const ajustadoCliente = conExperiencia * (1 + ajusteCliente / 100);

    document.getElementById('precioHora').innerHTML = `
      <strong>💰 Precio por hora sugerido:</strong>
      <span style="font-size: 1.4em; color: darkblue;">$${ajustadoCliente.toFixed(2)}</span>
    `;

    document.getElementById('detalle').innerHTML = `
      <small>📌 Basado en regla 50/30/20, con tus ajustes de experiencia e impuestos. Ajuste cliente: <strong>${ajusteCliente}%</strong>.</small>
    `;

    document.getElementById('resultado').style.display = 'block';
    return;
  }

  alert("🛑 Este cálculo solo está disponible para trabajos por proyecto, evento u hora.");
}