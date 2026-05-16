import { useState, useRef, useCallback } from 'react';

/**
 * Hook reutilizável para proteger contra double-click / double-submit.
 *
 * Uso:
 *   const { isSubmitting, guard } = useSubmitGuard();
 *
 *   async function handleSave() {
 *       await guard(async () => {
 *           await api.post('/endpoint', data);
 *       });
 *   }
 *
 *   <button disabled={isSubmitting}>Salvar</button>
 */
export default function useSubmitGuard() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const lockRef = useRef(false);

    const guard = useCallback(async (asyncFn) => {
        // Double-check: state + ref para cobrir batched renders do React
        if (lockRef.current) return;
        lockRef.current = true;
        setIsSubmitting(true);

        try {
            await asyncFn();
        } finally {
            lockRef.current = false;
            setIsSubmitting(false);
        }
    }, []);

    return { isSubmitting, guard };
}

/**
 * Hook para proteger múltiplas ações simultâneas por ID.
 * Útil para listas onde cada item tem ações independentes (pagar, deletar, etc.)
 *
 * Uso:
 *   const { isActionInProgress, guardAction } = useActionGuard();
 *
 *   async function handlePay(bill) {
 *       await guardAction(bill.id, async () => {
 *           await api.patch(`/bills/${bill.id}/pay`);
 *       });
 *   }
 *
 *   <button disabled={isActionInProgress(bill.id)}>Pagar</button>
 */
export function useActionGuard() {
    const [activeIds, setActiveIds] = useState(new Set());
    const lockSet = useRef(new Set());

    const isActionInProgress = useCallback((id) => {
        return activeIds.has(id);
    }, [activeIds]);

    const guardAction = useCallback(async (id, asyncFn) => {
        if (lockSet.current.has(id)) return;
        lockSet.current.add(id);
        setActiveIds(prev => new Set([...prev, id]));

        try {
            await asyncFn();
        } finally {
            lockSet.current.delete(id);
            setActiveIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }, []);

    return { isActionInProgress, guardAction };
}
