export type ServiceStatus = "booked" | "in_progress" | "completed" | "cancelled";
export interface ServiceRecord {
  id:string; vehicleId:string; vehicleLabel:string; customerName:string; customerPhone:string; jobType:string; status:ServiceStatus;
  receivedDate:string; dueDate:string; warrantyUntil:string; warrantyProvider:string; estimatedCost:number; actualCost:number; notes:string; createdAt:string; updatedAt:string;
}
export const SERVICE_STATUS_LABEL:Record<ServiceStatus,string>={booked:"Booked",in_progress:"In progress",completed:"Completed",cancelled:"Cancelled"};
export const EMPTY_SERVICE:Omit<ServiceRecord,"id"|"createdAt"|"updatedAt">={vehicleId:"",vehicleLabel:"",customerName:"",customerPhone:"",jobType:"",status:"booked",receivedDate:new Date().toISOString().slice(0,10),dueDate:"",warrantyUntil:"",warrantyProvider:"",estimatedCost:0,actualCost:0,notes:""};
