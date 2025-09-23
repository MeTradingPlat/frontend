export interface NavMenuItem {
  id:number;
  path: string;
  iconClass: string;
  buttonText: string;
  action: () => void;
  disabled?: boolean;
}
