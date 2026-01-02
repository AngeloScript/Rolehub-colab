
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FollowRequest, User } from '@/lib/types';
import Link from 'next/link';

export function FollowRequestsSection({ userId }: { userId: string }) {
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;

        const fetchRequests = async () => {
            try {
                const { data, error } = await supabase
                    .from('follow_requests')
                    .select('*, follower:users!follower_id(*)')
                    .eq('target_id', userId)
                    .eq('status', 'pending');

                if (error) throw error;

                if (isMounted) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mappedRequests = (data || []).map((req: any) => ({
                        id: req.id,
                        followerId: req.follower_id,
                        targetId: req.target_id,
                        status: req.status,
                        created_at: req.created_at,
                        follower: {
                            id: req.follower.id,
                            name: req.follower.name,
                            avatar: req.follower.avatar,
                            email: req.follower.email,
                            savedEvents: [],
                            following: [],
                            followers: 0,
                            checkIns: 0,
                            bio: '',
                            relationshipStatus: 'not_specified'
                        } as User
                    }));
                    setRequests(mappedRequests);
                }
            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchRequests();

        return () => { isMounted = false; };
    }, [userId]);

    const handleAccept = async (request: FollowRequest) => {
        try {
            // 1. Update request status
            const { error: reqError } = await supabase
                .from('follow_requests')
                .update({ status: 'accepted' })
                .eq('id', request.id);

            if (reqError) throw reqError;

            // 2. Update Follower's 'following' list (This might fail if RLS prevents it)
            // We need to fetch their current following list first
            const { data: followerData } = await supabase
                .from('users')
                .select('following')
                .eq('id', request.followerId)
                .single();

            const currentFollowing = followerData?.following || [];
            if (!currentFollowing.includes(userId)) {
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ following: [...currentFollowing, userId] })
                    .eq('id', request.followerId);

                if (updateError) {
                    console.warn("Could not update follower's following list (RLS?).", updateError);
                    // If we can't update their list, we should probably still count it in our followers?
                    // Or maybe we rely on the implementation of 'isFollowing' to check the request table too.
                    // For now, let's assume it works or just log warning.
                }
            }

            // 3. Update My 'followers' count
            const { data: myData } = await supabase.from('users').select('followers').eq('id', userId).single();
            await supabase.from('users').update({ followers: (myData?.followers || 0) + 1 }).eq('id', userId);

            // 4. Remove from local list
            setRequests(prev => prev.filter(r => r.id !== request.id));
            toast({ title: "Solicitação aceita" });

            // Notify them
            await supabase.from('notifications').insert({
                user_id: request.followerId,
                type: 'new_follower', // Or 'request_accepted'
                text: `<strong>Você</strong> agora segue uma conta privada.`, // Generic
                read: false,
                sender_name: 'Sistema', // Or my name
                link: `/profile/${userId}`
            });


        } catch (error) {
            console.error("Error accepting request:", error);
            toast({ variant: "destructive", title: "Erro ao aceitar" });
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('follow_requests')
                .delete()
                .eq('id', requestId);

            if (error) throw error;

            setRequests(prev => prev.filter(r => r.id !== requestId));
            toast({ title: "Solicitação removida" });
        } catch (error) {
            console.error("Error rejecting:", error);
            toast({ variant: "destructive", title: "Erro ao rejeitar" });
        }
    };

    if (isLoading || requests.length === 0) return null;

    return (
        <div className="mb-6 bg-card border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-3">Solicitações de Seguidores ({requests.length})</h3>
            <div className="space-y-3">
                {requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between">
                        <Link href={`/profile/${req.followerId}`} className="flex items-center gap-3 hover:opacity-80">
                            <Avatar>
                                <AvatarImage src={req.follower?.avatar} />
                                <AvatarFallback>{req.follower?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{req.follower?.name}</span>
                        </Link>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAccept(req)} className="bg-primary h-8 px-3">
                                <Check className="w-4 h-4 mr-1" /> Aceitar
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleReject(req.id)} className="h-8 px-3">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
