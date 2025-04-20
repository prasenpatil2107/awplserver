export interface User {
    id?: number;
    name: string;
    leg?: 'Bonus' | 'Incentive' | null;
    added_under_id?: number | null;
    mobile_no?: string | null;
    address?: string | null;
    work?: string | null;
    remarks?: string | null;
    userid?: string | null;
    password?: string | null;
    sp_value?: number;
    is_green?: boolean;
}

export interface Product {
    id?: number;
    product_name: string;
    mrp: number;
    dp: number;
    sp: number;
    description?: string | null;
    link?: string | null;
}

export interface Sale {
    id?: number;
    user_id: number;
    product_id: number;
    mrp: number;
    dp: number;
    sp: number;
    date: string;
    sold_rate: number;
    quantity: number;
    final_amount: number;
}

export interface Payment {
    id?: number;
    user_id: number;
    amount: number;
    date: string;
}

export interface Prescription {
    id?: number;
    user_id: number;
    date: string;
    remarks?: string | null;
}

export interface PrescriptionMedicine {
    id?: number;
    prescription_id: number;
    product_id: number;
    morning_dose?: string | null;
    evening_dose?: string | null;
}

export interface PrescriptionWithMedicines extends Prescription {
    medicines?: PrescriptionMedicine[];
} 