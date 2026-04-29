import { redirect } from "next/navigation";

export default function RootPage() {
  // Redireciona para o Login para permitir escolha de perfil rápida
  redirect("/login");
}
