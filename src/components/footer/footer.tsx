import Link from "next/link"
import Image from "next/image"

export function Footer() {
    return (
        <footer className="relative border-t border-white/10 bg-[#0D1B2A] py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                    {/* Brand */}
                    <div className="col-span-2 sm:col-span-1">
                        <Link href="/" className="flex items-center gap-1 mb-3">
                            <Image
                                src="/logo_120.png"
                                alt="Largada"
                                width={40}
                                height={40}
                            />
                            <span className="font-[family-name:var(--font-logo)] text-xl tracking-wide text-white">LARGADA</span>
                        </Link>
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
                    <div className="flex items-center gap-4">
                        <a
                            href="https://www.strava.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Image
                                src="/strava/api_logo_cptblWith_strava_horiz_white.svg"
                                alt="Compatible with Strava"
                                width={365}
                                height={37}
                                className="h-6 w-auto"
                                unoptimized
                            />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}