import Modal from "@/components/Modal";
import ClientForm from "@/app/(app)/clients/ClientForm";

export default function NewClientModal() {
  return (
    <Modal maxWidthClassName="max-w-3xl">
      <div className="modal-compact">
        <h1 className="text-lg font-bold mb-3 text-white">Nuevo Cliente</h1>
        <ClientForm />
      </div>
    </Modal>
  );
}
