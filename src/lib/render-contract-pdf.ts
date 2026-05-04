import type { ContractData } from "@/components/pdf/contract-residential";
import { renderContractResidentialPdf } from "@/components/pdf/contract-residential";
import { renderContractVehiclePdf }     from "@/components/pdf/contract-vehicle";
import { renderContractEquipmentPdf }   from "@/components/pdf/contract-equipment";
import { renderContractHospitalityPdf } from "@/components/pdf/contract-hospitality";

export type { ContractData };

export async function renderContractPdf(
  templateType: string,
  contractData: ContractData
): Promise<Buffer> {
  switch (templateType) {
    case "VEHICLE":     return renderContractVehiclePdf(contractData);
    case "EQUIPMENT":   return renderContractEquipmentPdf(contractData);
    case "HOSPITALITY": return renderContractHospitalityPdf(contractData);
    default:            return renderContractResidentialPdf(contractData);
  }
}
