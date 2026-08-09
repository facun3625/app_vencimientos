import { redirect } from "next/navigation";
import Modal from "@/components/Modal";
import RegisterForm from "@/app/(auth)/register/RegisterForm";
import { getPlanForRegister } from "@/app/(auth)/register/getPlan";

export default async function RegisterModal({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = await getPlanForRegister(params.plan);
  if (!plan) redirect("/precios");

  return (
    <Modal maxWidthClassName="max-w-lg">
      <img src="/logo_fondo_oscuro.png" alt="Kairos" className="h-11 w-auto mx-auto mb-5 drop-shadow-2xl" />
      <RegisterForm plan={plan} />
    </Modal>
  );
}
