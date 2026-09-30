export type CustomerKind = "lead" | "customer";
export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  kind: CustomerKind;
  source: string;
  nextFollowUp: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export const EMPTY_CUSTOMER: Omit<CustomerRecord,"id"|"createdAt"|"updatedAt"> = {name:"",phone:"",email:"",address:"",city:"",kind:"lead",source:"",nextFollowUp:"",notes:""};
