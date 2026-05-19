import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Terminos() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-gray-100">
        <Link to="/registro" className="inline-flex items-center text-sm text-[#bc430d] font-bold mb-8 hover:underline group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Volver al registro
        </Link>
        
        <h1 className="text-4xl font-black text-[#241705] mb-2 italic tracking-tighter">Pistn</h1>
        <h2 className="text-2xl font-bold text-[#241705] mb-8">Términos de Servicio</h2>
        
        <div className="space-y-8 text-[#241705]/80 text-sm leading-relaxed">
          <p className="font-medium italic">Última actualización: Mayo 2024</p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">1. ACEPTACIÓN DE LOS TÉRMINOS</h3>
            <p>Pistn opera bajo el principio de <strong>Consentimiento Activo</strong>. Al marcar la casilla de aceptación en el formulario de registro y hacer clic en "Crear Cuenta", usted otorga una manifestación libre, específica e informada para el tratamiento de sus datos según estos Términos. Si no está de acuerdo, debe abstenerse de utilizar la plataforma.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">2. DESCRIPCIÓN DEL SERVICIO</h3>
            <p>Pistn proporciona una herramienta SaaS (Software como Servicio) para la gestión de órdenes de trabajo, inventario, clientes y facturación de talleres mecánicos. Pistn no interviene en la relación comercial entre el taller y sus clientes finales.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">3. REGISTRO Y SEGURIDAD DE CUENTAS</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Los Dueños de Taller son responsables de la custodia de su "Licencia SaaS".</li>
              <li>El taller es responsable de las acciones realizadas por sus empleados registrados mediante los "Join Codes".</li>
              <li>La recuperación de acceso se basa en "Preguntas de Seguridad" configuradas por el usuario.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">4. RESPONSABILIDAD TÉCNICA Y MECÁNICA</h3>
            <p>El Taller reconoce que Pistn es una herramienta de registro y no un sistema de diagnóstico automático. La responsabilidad legal por las reparaciones recae exclusivamente sobre el taller y sus técnicos.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">5. PROPIEDAD INTELECTUAL</h3>
            <p>Pistn es propiedad intelectual protegida. El uso del sistema otorga una licencia de uso no exclusiva y revocable. Queda prohibida la ingeniería inversa o copia de la interfaz.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">6. SUSPENSIÓN DEL SERVICIO</h3>
            <p>Pistn se reserva el derecho de suspender el acceso por falta de pago, uso indebido o solicitud legal de autoridades competentes.</p>
          </section>

          <div className="pt-8 border-t border-gray-100 italic text-[12px]">
            <p><strong>CLÁUSULA DE EXENCIÓN DE RESPONSABILIDAD:</strong> Pistn se entrega "tal cual" (As-Is). No nos hacemos responsables por pérdidas de ingresos derivadas de caídas temporales del servicio o pérdida de datos por mal uso del usuario.</p>
          </div>
        </div>
      </div>
    </div>
  );
}