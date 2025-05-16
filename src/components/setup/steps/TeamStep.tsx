"use client";

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const teamSchema = z.object({
  email: z.string().email('Please enter a valid email address').optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamStepProps {
  initialData?: {
    invites: string[];
  };
  onComplete: (data: { team: { invites: string[] } }) => void;
  onBack: () => void;
}

export default function TeamStep({
  initialData,
  onComplete,
  onBack,
}: TeamStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invites, setInvites] = useState<string[]>(initialData?.invites || []);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      email: '',
    },
  });

  const addInvite = (email: string) => {
    if (!email || invites.includes(email)) return;
    setInvites([...invites, email]);
    form.reset();
  };

  const removeInvite = (email: string) => {
    setInvites(invites.filter(e => e !== email));
  };

  const onSubmit = async (data: TeamFormData) => {
    if (data.email) {
      addInvite(data.email);
      return;
    }

    try {
      setIsSubmitting(true);
      await onComplete({ team: { invites } });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Invite Team Members</h3>
        <p className="text-sm text-gray-500 mb-4">
          Invite your team members to join your organization. You can skip this step
          and invite them later.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      placeholder="colleague@example.com"
                      {...field}
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={isSubmitting}
                    >
                      Add
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {invites.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Pending Invites</h4>
          <div className="space-y-2">
            {invites.map(email => (
              <div
                key={email}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <span className="text-sm">{email}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInvite(email)}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => onComplete({ team: { invites } })}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Completing...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );
} 