// Avisos extraídos de la sección "SRES. COPROPIETARIOS" de cada liquidación
// Nota: el archivo del PDF tiene fecha de vencimiento (mes siguiente al período)

export interface Notice {
  month: string; // "2025-07" — período de la liquidación
  label: string;
  text: string;
}

export const notices: Notice[] = [
  {
    month: "2025-07",
    label: "Julio 2025",
    text: "Se normalizaron las facturas de AySA y llegaron los créditos por la que se pagó en exceso y la refacturación de las facturas por lo que se estarán abonando este mes. Asimismo les informamos que comenzaremos con obras de mantenimiento necesarias en el edificio para evitar que siga deteriorándose y evitar problemas.",
  },
  {
    month: "2025-08",
    label: "Agosto 2025",
    text: "Se continúan con las obras en el edificio, esperamos poder ir acondicionando lo mejor posible todo como para empezar a cambiar el aspecto del edificio en general. Este mes se hará una reparación del portón de garaje que venía con algunos inconvenientes en su funcionamiento.",
  },
  {
    month: "2025-09",
    label: "Septiembre 2025",
    text: "Se continúan con las obras en el edificio, esperamos poder ir acondicionando lo mejor posible todo como para empezar a cambiar el aspecto del edificio en general.",
  },
  {
    month: "2025-10",
    label: "Octubre 2025",
    text: "Se continúan con las obras en el edificio, este mes se estará arreglando los palieres internos del primer cuerpo del edificio, por lo tanto rogamos disculpar las molestias ocasionadas.",
  },
  {
    month: "2025-11",
    label: "Noviembre 2025",
    text: "Se continúan con las obras en el edificio, este mes se estará arreglando los palieres internos del segundo cuerpo del edificio, por lo tanto rogamos disculpar las molestias ocasionadas.",
  },
  {
    month: "2025-12",
    label: "Diciembre 2025",
    text: "Con el corte de luz se rompió la caja de operador del ascensor del segundo cuerpo, asimismo se encaró la reparación de la vereda. Y también se debe abonar este mes la suplencia del personal de limpieza. Por eso fue necesario hacer un ajuste en el valor de las expensas para poder llegar con los gastos.",
  },
  {
    month: "2026-01",
    label: "Enero 2026",
    text: "El consorcio está con muchos gastos de mantenimiento en simultáneo. Se realizó tareas de recambio de las lámparas internas de luz las cuales tenían un tipo de lámpara que consume más watts (Dulux) siendo únicamente reemplazables por otras iguales, se cambiaron a un sistema de luces LED las cuales iluminan más y gastan menos. Asimismo se cambiaron las luces de emergencias que tenían las baterías agotadas y costo de cambiar las baterías daba lo mismo que cambiar todo el artefacto. Se limpiaron los plafones y se cambiaron las lámparas quemadas, asimismo se cambiaron las luces dicroicas comunes por luces dicroicas LED de 220V para lo cual fue necesario cambiar su conector. La idea es continuar con la pintura de espacios comunes y esperamos pronto encarar la pintura del frente del edificio para que la fachada esté en condiciones.",
  },
  {
    month: "2026-02",
    label: "Febrero 2026",
    text: "Se continúan con las obras en el edificio, este mes se estará arreglando los palieres internos del segundo cuerpo del edificio, por lo tanto rogamos disculpar las molestias ocasionadas.",
  },
  {
    month: "2026-03",
    label: "Marzo 2026",
    text: "De acuerdo a los gastos del edificio hubo que realizar el aumento de las expensas, es estrictamente para cubrir los gastos ordinarios de mantenimiento general, recarga de matafuegos, acondicionamiento de las luces de emergencia y otras luces. Queda una tercera cuota por el trabajo sobre las luces del edificio y se termina con ese gasto. Pero debemos continuar con el acondicionamiento del edificio. Se están pidiendo presupuestos para continuar una vez se alivie un poco los gastos generales. Asimismo estamos en conocimiento de la falla del portero, se están pidiendo presupuestos también por ellos y por la pintura del palier interno del segundo cuerpo. Queda también el acondicionamiento exterior.",
  },
];
