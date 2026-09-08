export interface CompanySubscription {
    plan: 'starter' | 'professional' | 'enterprise' | 'trial' | 'PRO' | 'ENTERPRISE' | 'FREE_TRIAL' | 'STARTER' | string;
    status: 'active' | 'past_due' | 'trialing' | 'canceled' | string;
    seats: number;
    usedSeats: number;
    currentPeriodEnd: string;
    monthlyRevenue: number;
}

export interface Company {
    id: string;
    name: string;
    domain: string;
    industry: string;
    size: string;
    status: 'active' | 'inactive' | 'pending';
    subscription: CompanySubscription;
    createdAt: string;
    revenue: number;
    userCount: number;
    logo?: string;
    contact?: {
        email: string;
        phone: string;
        location: string;
    };
}
