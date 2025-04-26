export interface User {
    id?: number;
    name: string;
    leg?: 'Bonus' | 'Incentive' | null;
    added_under_id?: number;
    mobile_no?: string;
    address?: string;
    work?: string;
    remarks?: string;
    userid?: string;
    password?: string;
}

export interface Product {
    id?: number;
    product_name: string;
    mrp: number;
    dp: number;
    sp: number;
    description?: string;
    link?: string;
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

export interface PrescriptionMedicine {
    id?: number;
    prescription_id?: number;
    product_id: number;
    morning_dose: string;
    evening_dose: string;
}

export interface Prescription {
    id?: number;
    user_id: number;
    date: string;
    remarks: string;
    medicines: PrescriptionMedicine[];
} 