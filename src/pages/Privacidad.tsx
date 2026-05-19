import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-gray-100">
        <Link to="/registro" className="inline-flex items-center text-sm text-[#bc430d] font-bold mb-8 hover:underline group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Volver al registro
        </Link>
        
        <h1 className="text-4xl font-black text-[#241705] mb-2 italic tracking-tighter">Pistn</h1>
        <h2 className="text-2xl font-bold text-[#241705] mb-8">Política de Privacidad</h2>
        
        <div className="space-y-8 text-[#241705]/80 text-sm leading-relaxed">
          <p className="font-medium italic">Última actualización: Mayo 2024</p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">1. RECOLECCIÓN DE INFORMACIÓN</h3>
            <p>Pistn recolecta datos del taller (nombre, contacto, logo), del personal (nombre, email, rol), de clientes (contacto) y de vehículos (placas, modelos, imágenes de peritaje).</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">2. USO DE LA INFORMACIÓN</h3>
            <p>La información se utiliza exclusivamente para operar los módulos de gestión, generar reportes, facturas y notificaciones. <strong>NO venderemos ni compartiremos</strong> sus datos con terceros para fines publicitarios.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">3. PROPIEDAD DE LOS DATOS</h3>
            <p>Los datos ingresados pertenecen al taller. Pistn actúa como "Encargado del Tratamiento". En caso de baja, se generará un respaldo antes del borrado definitivo.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">4. SEGURIDAD DE LOS DATOS</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Row Level Security (RLS):</strong> Aislamiento total entre talleres.</li>
              <li><strong>Encriptación:</strong> Contraseñas hasheadas y comunicación HTTPS cifrada.</li>
              <li><strong>Cloud Hosting:</strong> Infraestructura segura mediante Supabase/PostgreSQL.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">5. DERECHOS ARCO</h3>
            <p>Garantizamos sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición</strong>. Puede gestionar su información desde el panel de configuración o solicitar el borrado de su cuenta.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#241705]">6. COOKIES Y TECNOLOGÍAS</h3>
            <p>Utilizamos cookies técnicas de sesión y Cloudflare Turnstile para protección contra ataques de bots y spam.</p>
          </section>

          <div className="pt-8 border-t border-gray-100 text-center">
            <p className="text-[#241705]/60 text-[12px]">Pistn - Gestión Profesional para Talleres Mecánicos</p>
          </div>
        </div>
      </div>
    </div>
  );
}