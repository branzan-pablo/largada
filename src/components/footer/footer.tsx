import Link from "next/link"

export function Footer() {
    return (
        <footer className="relative border-t border-white/10 bg-[#0D1B2A] py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                    {/* Brand */}
                    <div className="col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-[#FF4D00] rounded flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">L</span>
                            </div>
                            <span className="text-white font-medium">Largada</span>
                        </div>
                        <p className="text-sm text-gray-400 max-w-xs">
                            O calendário de corridas de rua do Brasil.
                        </p>
                    </div>

                    {/* Plataforma */}
                    <div>
                        <p className="text-sm font-semibold text-white mb-4">Plataforma</p>
                        <nav className="flex flex-col gap-2.5 text-sm text-gray-400">
                            <Link href="/corridas" className="hover:text-white transition-colors">
                                Corridas
                            </Link>
                            <a href="#features" className="hover:text-white transition-colors">
                                Funcionalidades
                            </a>
                            <Link href="/sugerir" className="hover:text-white transition-colors">
                                Sugerir Evento
                            </Link>
                        </nav>
                    </div>

                    {/* Legal */}
                    <div>
                        <p className="text-sm font-semibold text-white mb-4">Legal</p>
                        <nav className="flex flex-col gap-2.5 text-sm text-gray-400">
                            <Link href="/termos-de-uso" className="hover:text-white transition-colors">
                                Termos de Uso
                            </Link>
                            <Link href="/politica-de-privacidade" className="hover:text-white transition-colors">
                                Privacidade
                            </Link>
                            <Link href="/contato" className="hover:text-white transition-colors">
                                Contato
                            </Link>
                        </nav>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500">
                        &copy; {new Date().getFullYear()} Largada. Todos os direitos reservados.
                    </p>
                    <p className="text-xs text-gray-500">
                        Nasceu no interior de SP. Chegou ao Brasil.
                    </p>
                </div>
            </div>
        </footer>
    )
}