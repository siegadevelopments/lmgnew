import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  userId: string;
  onSuccess: () => void;
}

export function BulkImportTab({ userId, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing">("upload");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data);
        setStep("preview");
        setLoading(false);
      },
      error: (error) => {
        toast.error("Failed to parse CSV: " + error.message);
        setLoading(false);
      }
    });
  };

  const startImport = async () => {
    setStep("importing");
    setLoading(true);

    let successCount = 0;
    let errorCount = 0;

    for (const row of preview) {
      try {
        // Basic mapping for Shopify/WooCommerce common fields
        const title = row.Title || row.Name || row['Product Name'];
        const price = parseFloat(row['Variant Price'] || row['Regular price'] || row.Price || "0");
        const stock = parseInt(row['Variant Inventory Qty'] || row.Stock || row.Quantity || "50");
        const content = row['Body (HTML)'] || row.Description || row.Content || "";
        const image_url = row['Image Src'] || row['Featured Image'] || null;
        
        if (!title) continue;

        const slug = title.toLowerCase().replace(/[\s\W-]+/g, "-") + "-" + Math.floor(Math.random() * 1000);

        const { error } = await (supabase.from("products") as any).insert({
          vendor_id: userId,
          title,
          slug,
          price,
          stock,
          content,
          image_url,
          status: "published"
        });

        if (error) throw error;
        successCount++;
      } catch (err) {
        console.error("Import error row:", row, err);
        errorCount++;
      }
    }

    setLoading(false);
    toast.success(`Import completed: ${successCount} successful, ${errorCount} failed.`);
    onSuccess();
    setStep("upload");
    setFile(null);
    setPreview([]);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Bulk Product Import</CardTitle>
        <CardDescription>Upload a CSV file from Shopify or WooCommerce to add multiple products at once.</CardDescription>
      </CardHeader>
      <CardContent>
        {step === "upload" && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-12 bg-muted/10">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-center space-y-2">
              <p className="font-medium">Drop your CSV file here or click to browse</p>
              <p className="text-xs text-muted-foreground">Supported formats: Shopify CSV, WooCommerce CSV</p>
            </div>
            <Input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              id="csv-upload" 
              onChange={handleFileChange}
            />
            <Button asChild className="mt-6">
              <label htmlFor="csv-upload">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Select CSV File
              </label>
            </Button>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-medium">{preview.length} products found in file</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("upload")}>Cancel</Button>
                <Button onClick={startImport} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Import All Products
                </Button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Title/Name</th>
                    <th className="p-2 text-left">Price</th>
                    <th className="p-2 text-left">Stock</th>
                    <th className="p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 font-medium">{row.Title || row.Name || row['Product Name'] || "Unknown"}</td>
                      <td className="p-2">${row['Variant Price'] || row['Regular price'] || row.Price || "0"}</td>
                      <td className="p-2">{row['Variant Inventory Qty'] || row.Stock || row.Quantity || "50"}</td>
                      <td className="p-2 truncate max-w-[200px]">{row['Body (HTML)'] || row.Description || row.Content || "No description"}</td>
                    </tr>
                  ))}
                  {preview.length > 10 && (
                    <tr>
                      <td colSpan={4} className="p-2 text-center text-muted-foreground italic bg-muted/5">
                        ... and {preview.length - 10} more products
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
              <div className="text-xs text-blue-700 leading-relaxed">
                <p className="font-bold mb-1">Auto-Mapping Enabled</p>
                We've automatically mapped columns for Shopify and WooCommerce. Please ensure your prices and titles look correct in the preview above before clicking import.
              </div>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-bold text-lg">Importing Products...</p>
              <p className="text-muted-foreground">Please do not close this window while we process your file.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
