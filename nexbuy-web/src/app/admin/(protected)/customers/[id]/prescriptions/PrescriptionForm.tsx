"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface PrescriptionInitial {
  id?: string;
  exam_date: string; // YYYY-MM-DD
  right_sphere: number | null;
  right_cylinder: number | null;
  right_axis: number | null;
  right_add: number | null;
  left_sphere: number | null;
  left_cylinder: number | null;
  left_axis: number | null;
  left_add: number | null;
  pd: number | null;
  notes: string | null;
}

interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

interface Props {
  customerId: string;
  initial: PrescriptionInitial;
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  submitLabel: string;
}

export function PrescriptionForm({ customerId, initial, action, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  const fieldErr = (k: string) => state?.fieldErrors?.[k]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rx-exam">驗光日</Label>
          <Input
            id="rx-exam"
            name="exam_date"
            type="date"
            required
            defaultValue={initial.exam_date}
          />
          {fieldErr("exam_date") && <FieldErr msg={fieldErr("exam_date")!} />}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rx-pd">PD（瞳距 mm）</Label>
          <Input
            id="rx-pd"
            name="pd"
            type="number"
            min={40}
            max={90}
            step={1}
            defaultValue={initial.pd ?? ""}
            placeholder="例如 62"
          />
          {fieldErr("pd") && <FieldErr msg={fieldErr("pd")!} />}
        </div>
      </div>

      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium">右眼 (OD)</legend>
        <EyeRow
          eye="right"
          sphere={initial.right_sphere}
          cylinder={initial.right_cylinder}
          axis={initial.right_axis}
          add={initial.right_add}
          fieldErr={fieldErr}
        />
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium">左眼 (OS)</legend>
        <EyeRow
          eye="left"
          sphere={initial.left_sphere}
          cylinder={initial.left_cylinder}
          axis={initial.left_axis}
          add={initial.left_add}
          fieldErr={fieldErr}
        />
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="rx-notes">備註（選填）</Label>
        <Textarea
          id="rx-notes"
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={initial.notes ?? ""}
          placeholder="鏡片建議、特殊需求…"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "儲存中…" : submitLabel}
        </Button>
        <Link
          href={`/admin/customers/${customerId}`}
          className={buttonVariants({ variant: "outline" })}
        >
          取消
        </Link>
      </div>
    </form>
  );
}

function EyeRow({
  eye,
  sphere,
  cylinder,
  axis,
  add,
  fieldErr,
}: {
  eye: "right" | "left";
  sphere: number | null;
  cylinder: number | null;
  axis: number | null;
  add: number | null;
  fieldErr: (k: string) => string | undefined;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <NumField
        id={`${eye}-sphere`}
        name={`${eye}_sphere`}
        label="球面 SPH"
        defaultValue={sphere}
        step={0.25}
        min={-30}
        max={30}
        placeholder="-2.50"
        err={fieldErr(`${eye}_sphere`)}
      />
      <NumField
        id={`${eye}-cyl`}
        name={`${eye}_cylinder`}
        label="散光 CYL"
        defaultValue={cylinder}
        step={0.25}
        min={-10}
        max={10}
        placeholder="-0.75"
        err={fieldErr(`${eye}_cylinder`)}
      />
      <NumField
        id={`${eye}-axis`}
        name={`${eye}_axis`}
        label="軸度 AXIS"
        defaultValue={axis}
        step={1}
        min={0}
        max={180}
        placeholder="90"
        err={fieldErr(`${eye}_axis`)}
      />
      <NumField
        id={`${eye}-add`}
        name={`${eye}_add`}
        label="加入度 ADD"
        defaultValue={add}
        step={0.25}
        min={0}
        max={5}
        placeholder="0.00"
        err={fieldErr(`${eye}_add`)}
      />
    </div>
  );
}

function NumField({
  id,
  name,
  label,
  defaultValue,
  step,
  min,
  max,
  placeholder,
  err,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: number | null;
  step: number;
  min: number;
  max: number;
  placeholder?: string;
  err?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type="number"
        step={step}
        min={min}
        max={max}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
      />
      {err && <FieldErr msg={err} />}
    </div>
  );
}

function FieldErr({ msg }: { msg: string }) {
  return <p className="text-xs text-destructive">{msg}</p>;
}
