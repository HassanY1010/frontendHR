import { create } from 'zustand';
import { Company } from './types';
import { companyService } from '@hr/services';

interface PortfolioStats {
    totalCompanies: number;
    activeUsers: number;
    totalRevenue: number;
    growthRate: number;
    planDistribution: Record<string, number>;
    aiUsage: number;
}

interface CompaniesState {
    companies: Company[];
    portfolioStats: PortfolioStats | null;
    aiAnalysis: any | null;
    loading: boolean;
    isAnalyzing: boolean;
    setCompanies: (companies: Company[]) => void;
    addCompany: (company: Company) => void;
    createCompany: (companyData: Partial<Company>) => Promise<Company>;
    updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
    deleteCompany: (id: string) => Promise<void>;
    refreshCompanies: () => Promise<void>;
    fetchPortfolioAnalytics: () => Promise<void>;
    analyzeCompany: (id: string) => Promise<void>;
    updateCompanyStatus: (id: string, status: string) => Promise<void>;
    forceLogout: (id: string) => Promise<void>;
}

const initialCompanies: Company[] = [];

export const useCompaniesStore = create<CompaniesState>((set, get) => ({
    companies: initialCompanies,
    portfolioStats: null,
    aiAnalysis: null,
    loading: false,
    isAnalyzing: false,
    setCompanies: (companies) => set({ companies }),
    addCompany: (company) => set((state) => ({
        companies: [company, ...state.companies]
    })),
    createCompany: async (companyData: Partial<Company>) => {
        set({ loading: true });
        try {
            const response: any = await companyService.create(companyData as any);
            const newCompany = response.data?.company || response.data || response;

            // Normalize the new company data structure to match store items if needed
            // But usually the response should match. We might need to ensure computed fields like 'subscription' object exist if backend doesn't return them fully populated.
            // For now, let's assume backend returns the created object.

            set((state) => ({
                companies: [newCompany, ...state.companies],
                loading: false
            }));
            return newCompany;
        } catch (error) {
            set({ loading: false });
            console.error('Failed to create company', error);
            throw error;
        }
    },
    updateCompany: async (id, updates) => {
        try {
            // Optimistic update
            set((state) => ({
                companies: state.companies.map(c => c.id === id ? { ...c, ...updates } : c)
            }));

            await companyService.update(id, updates as any);
            // Optionally refresh or just trust the optimism + standard revalidation
        } catch (error) {
            console.error('Failed to update company', error);
            // Revert on failure (could improve this by keeping previous state, but for now just log)
            // Ideally we should re-fetch to ensure sync
            const { refreshCompanies } = get();
            await refreshCompanies();
            throw error;
        }
    },
    deleteCompany: async (id) => {
        try {
            await companyService.delete(id);
            set((state) => ({
                companies: state.companies.filter(c => c.id !== id)
            }));
        } catch (error) {
            console.error('Failed to delete company', error);
            throw error;
        }
    },
    refreshCompanies: async () => {
        set({ loading: true });
        try {
            const response: any = await companyService.getAll();
            // Handle standard API wrapper { status: 'success', data: [...] } or { status: 'success', data: { companies: [...] } }
            const backendCompanies = response.data?.companies || response.data || response.companies || (Array.isArray(response) ? response : []);

            const companies: Company[] = backendCompanies.map((c: any) => {
                const managerUser = c.users?.[0];
                const subscription = c.subscriptions?.[0];
                return {
                    id: c.id,
                    name: c.name || 'Anonymous Company',
                    domain: c.domain || c.website || '',
                    industry: c.industry || 'Technology',
                    size: c.size || (c.employeeLimit > 50 ? 'Medium' : 'Small'),
                    status: c.status || (c.subscriptionStatus === 'ACTIVE' ? 'active' : 'inactive'),
                    subscription: {
                        plan: subscription?.plan?.toLowerCase() || 'trial',
                        status: subscription?.status?.toLowerCase() || 'active',
                        seats: subscription?.seats || c.employeeLimit || 10,
                        usedSeats: subscription?.usedSeats || c._count?.users || 0,
                        currentPeriodEnd: subscription?.endDate || c.subscriptionExpiry || new Date().toISOString(),
                        monthlyRevenue: subscription?.monthlyRevenue || (subscription?.plan === 'ENTERPRISE' ? 5000 : 99)
                    },
                    createdAt: c.createdAt,
                    revenue: subscription?.monthlyRevenue || 0,
                    userCount: c._count?.users || 0,
                    contact: {
                        email: managerUser?.email || `contact@${c.domain || c.website || 'company.com'}`,
                        phone: managerUser?.phone || c.phone || '',
                        location: c.address || managerUser?.location || ''
                    }
                };
            });

            set({ companies: companies || [], loading: false });
        } catch (error) {
            console.error('Failed to fetch companies', error);
            set({ loading: false });
        }
    },
    fetchPortfolioAnalytics: async () => {
        try {
            const response: any = await companyService.getPortfolioAnalytics();
            // Handle standard API wrapper { status: 'success', data: { ... } }
            const stats = response.data || response;
            set({ portfolioStats: stats });
        } catch (error) {
            console.error('Failed to fetch portfolio analytics', error);
        }
    },
    analyzeCompany: async (id) => {
        set({ isAnalyzing: true });
        try {
            const response: any = await companyService.analyzeCompany(id);
            const analysis = response.data || response;
            set({ aiAnalysis: analysis });
        } catch (error) {
            console.error('Failed to analyze company', error);
        } finally {
            set({ isAnalyzing: false });
        }
    },
    updateCompanyStatus: async (id, status) => {
        try {
            // Optimistic update
            set((state) => ({
                companies: state.companies.map(c => c.id === id ? { ...c, status: status as any } : c)
            }));

            await companyService.updateStatus(id, status);
        } catch (error) {
            console.error('Failed to update company status', error);
            const { refreshCompanies } = get();
            await refreshCompanies();
            throw error;
        }
    },
    forceLogout: async (id) => {
        try {
            await companyService.forceLogout(id);
        } catch (error) {
            console.error('Failed to force logout company users', error);
            throw error;
        }
    }
}));
