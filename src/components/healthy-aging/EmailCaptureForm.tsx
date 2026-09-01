"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { subscribeToBrevo } from "@/actions/brevo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

interface EmailCaptureFormProps {
  buttonText?: string;
}

export function EmailCaptureForm({ buttonText = "Get Instant Access" }: EmailCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      email: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("firstName", data.firstName);
    formData.append("email", data.email);

    const result = await subscribeToBrevo(formData);

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      form.reset();
    } else {
      setErrorMsg(result.error || "An error occurred. Please try again.");
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-xl bg-teal-50 p-6 flex flex-col items-center justify-center text-center space-y-4 border border-teal-200 shadow-sm animate-in fade-in zoom-in duration-300">
        <CheckCircle2 className="w-12 h-12 text-teal-600" />
        <div className="space-y-1">
          <h4 className="font-bold text-teal-900 text-xl">You're All Set!</h4>
          <p className="text-teal-800 text-sm">
            Your Healthy Ageing Starter Kit PDF is ready. We've also emailed a copy to your inbox!
          </p>
        </div>
        <a
          href="/Healthy_Ageing_Starter_Kit.pdf"
          download="Healthy_Ageing_Starter_Kit.pdf"
          className="inline-flex items-center justify-center gap-2 w-full h-12 px-6 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg transition-colors shadow-md text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Free PDF Guide
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="First Name"
                      className="bg-white text-gray-900 border-gray-300 focus-visible:ring-teal-600 h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm font-medium" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email Address"
                      className="bg-white text-gray-900 border-gray-300 focus-visible:ring-teal-600 h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm font-medium" />
                </FormItem>
              )}
            />
          </div>

          {errorMsg && (
            <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-md border border-red-100">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-teal-700 hover:bg-teal-800 text-white transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {buttonText}
          </Button>
          <p className="text-xs text-center text-gray-500">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>
      </Form>
    </div>
  );
}
