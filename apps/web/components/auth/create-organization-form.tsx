"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "@workspace/icons/lucide";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";

const formSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50),
});

export function CreateOrganizationForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      await authClient.organization.create({
        name: values.name,
        slug: values.slug,
      });

      toast.success("Organization created successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl w-full p-0 gap-0">
      <CardHeader className="p-4">
        <CardTitle>Create Organization</CardTitle>
        <CardDescription>
          Create a new organization to get started
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="p-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Organization"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value);

                        const slug = value
                          .normalize("NFKD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-+|-+$/g, "");

                        form.setValue("slug", slug, {
                          shouldValidate: true,
                          shouldDirty: false,
                        });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="my-org" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={isLoading} type="submit">
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create Organization"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                authClient.signOut();
              }}
              type="button"
            >
              Sign out
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
