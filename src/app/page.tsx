"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { Upload, FileText, Cpu, Package, Factory, Info, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { HelpTooltip } from "@/components/common/help-tooltip";
import { extractSerialNumber, fetchProductInfo, searchProductInfo } from "./actions";
import { Logo } from "@/components/logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type Product = {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  description: string;
  imageUrl: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState("");

  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [productInfo, setProductInfo] = useState<Product | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchStatusMessage, setSearchStatusMessage] = useState<string | null>(null);

  const [showManualReviewSuccess, setShowManualReviewSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      resetState();
      setFile(selectedFile);
      setFileType(selectedFile.type);
      
      const reader = new FileReader();
      reader.onload = () => {
        setFileDataUri(reader.result as string);
      };
      reader.onerror = () => {
          toast({
            title: "File Read Error",
            description: "There was a problem reading your file. Please try again.",
            variant: "destructive",
          });
          resetState();
      };
      reader.readAsDataURL(selectedFile);

      if (selectedFile.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(selectedFile));
      }
    }
  };

  const handleExtractClick = async () => {
    if (!file || !fileDataUri) {
      toast({
        title: "File Error",
        description: "The file is not ready yet or failed to load. Please try re-uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    setSerialNumbers([]);
    setSelectedSerialNumber("");
    setProductInfo(null);
    setFetchError(null);
    setShowManualReviewSuccess(false);
    setSearchStatusMessage(null);

    try {
        const result = await extractSerialNumber({ fileDataUri });
        if (result.serialNumbers && result.serialNumbers.length > 0) {
            setSerialNumbers(result.serialNumbers);
            if (result.serialNumbers.length === 1) {
                setSelectedSerialNumber(result.serialNumbers[0]);
            }
        } else {
            setExtractionError("No serial number could be extracted. Please enter it manually.");
        }
    } catch (error) {
        setExtractionError("An AI error occurred during extraction. Please try again or enter manually.");
    } finally {
        setIsExtracting(false);
    }
  };

  const handleFetchInfoClick = async () => {
    if (!selectedSerialNumber) return;

    setIsFetchingInfo(true);
    setFetchError(null);
    setProductInfo(null);
    setShowManualReviewSuccess(false);

    // 1. Check DB
    setSearchStatusMessage("Checking internal database...");
    try {
      const info = await fetchProductInfo({ serialNumber: selectedSerialNumber });
      setProductInfo(info);
      setSearchStatusMessage(null);
      setIsFetchingInfo(false);
      return;
    } catch (error) {
      // Not found, continue to AI search.
    }

    // 2. AI search with serial number
    setSearchStatusMessage("Not in DB. Searching online with serial number...");
    try {
        const aiResult = await searchProductInfo({ serialNumber: selectedSerialNumber });
        if (aiResult.found && aiResult.product) {
            setProductInfo({
                ...aiResult.product,
                id: selectedSerialNumber,
                imageUrl: filePreview || 'https://placehold.co/400x400.png',
            });
            setSearchStatusMessage(null);
            setIsFetchingInfo(false);
            return;
        }
    } catch(e) {
        console.error("AI search (S/N) failed", e);
    }
    
    // 3. AI search with image if available
    if (fileDataUri) {
        setSearchStatusMessage("No clear result. Searching again with image context...");
        try {
            const aiResultWithImage = await searchProductInfo({
                serialNumber: selectedSerialNumber,
                fileDataUri: fileDataUri
            });
            
            if (aiResultWithImage.found && aiResultWithImage.product) {
                setProductInfo({
                    ...aiResultWithImage.product,
                    id: selectedSerialNumber,
                    imageUrl: filePreview || 'https://placehold.co/400x400.png'
                });
                setSearchStatusMessage(null);
            } else {
                setFetchError("Product information not found. You can submit this serial number for manual review.");
                setSearchStatusMessage(null);
            }
        } catch (e) {
             setFetchError("An AI error occurred during image search. You can submit for manual review.");
             setSearchStatusMessage(null);
        } finally {
            setIsFetchingInfo(false);
        }
    } else {
        setFetchError("Product information not found. You can submit for manual review.");
        setSearchStatusMessage(null);
        setIsFetchingInfo(false);
    }
  };


  const handleManualReviewSubmit = () => {
    setShowManualReviewSuccess(true);
    setFetchError(null);
  };

  const resetState = () => {
    setFile(null);
    setFilePreview(null);
    setFileDataUri(null);
    setFileType(null);
    setIsExtracting(false);
    setExtractionError(null);
    setSerialNumbers([]);
    setSelectedSerialNumber("");
    setIsFetchingInfo(false);
    setProductInfo(null);
    setFetchError(null);
    setShowManualReviewSuccess(false);
    setSearchStatusMessage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const UploadStage = () => (
    <div className="text-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx"
      />
      <div
        className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="bg-primary/10 text-primary rounded-full p-3">
          <Upload className="h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">Click to upload or drag and drop</p>
          <p className="text-sm text-muted-foreground">Image (PNG, JPG), PDF, or DOC</p>
        </div>
      </div>
    </div>
  );

  const PreviewStage = () => (
    <div className="space-y-6">
      <div className="relative rounded-lg overflow-hidden border p-2 bg-muted/30">
        {filePreview ? (
          <Image src={filePreview} alt="File preview" width={500} height={300} className="w-full h-auto object-contain rounded-md max-h-60" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">{file?.name}</p>
          </div>
        )}
        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={resetState}>
          <X className="h-4 w-4" />
          <span className="sr-only">Remove file</span>
        </Button>
      </div>
      <Button onClick={handleExtractClick} disabled={isExtracting || !fileDataUri} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        {isExtracting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Extracting...
          </>
        ) : "Extract Serial Number"}
      </Button>
    </div>
  );

  const SerialNumberStage = () => (
    <div className="space-y-4">
      {extractionError && (
        <Alert variant="default" className="bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700">
           <AlertCircle className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
          <AlertTitle className="font-semibold text-yellow-800 dark:text-yellow-200">Heads up!</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {extractionError}
          </AlertDescription>
        </Alert>
      )}

      {serialNumbers.length > 1 && (
        <RadioGroup value={selectedSerialNumber} onValueChange={setSelectedSerialNumber} className="space-y-2">
          <Label>Multiple serial numbers found. Please select the correct one:</Label>
          {serialNumbers.map((sn) => (
            <div key={sn} className="flex items-center space-x-2 bg-muted/50 p-3 rounded-md">
              <RadioGroupItem value={sn} id={sn} />
              <Label htmlFor={sn} className="font-mono text-sm tracking-wider w-full cursor-pointer">{sn}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      <div className="space-y-2">
        <Label htmlFor="serial-number-input">Serial Number</Label>
        <Input
          id="serial-number-input"
          placeholder="Enter or correct serial number"
          value={selectedSerialNumber}
          onChange={(e) => setSelectedSerialNumber(e.target.value)}
          className="font-mono tracking-wider"
        />
      </div>

      <Button onClick={handleFetchInfoClick} disabled={!selectedSerialNumber || isFetchingInfo} className="w-full">
        {isFetchingInfo ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Info...
            </>
          ) : "Fetch Product Info"}
      </Button>
    </div>
  );

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-body text-foreground">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <header className="flex justify-center mb-4">
          <Logo />
        </header>

        <Card className="w-full shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-headline">Step 1: Upload & Extract</CardTitle>
                <CardDescription>Upload an image or document to find the serial number.</CardDescription>
              </div>
              <HelpTooltip stepDescription="Uploading an image or document to find a serial number." />
            </div>
          </CardHeader>
          <CardContent>
            {!file ? <UploadStage /> : <PreviewStage />}
            {isExtracting && (
              <div className="flex justify-center items-center gap-2 text-muted-foreground mt-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>AI is analyzing your file...</p>
              </div>
            )}
            {(serialNumbers.length > 0 || extractionError) && !isExtracting && (
              <>
                <Separator className="my-6" />
                <SerialNumberStage />
              </>
            )}
          </CardContent>
        </Card>

        {isFetchingInfo && (
           <Card className="w-full shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-3 text-lg text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p>{searchStatusMessage || 'Fetching...'}</p>
                    </div>
                </CardContent>
            </Card>
        )}

        {productInfo && (
          <Card className="w-full shadow-lg animate-in fade-in-50">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Product Information</CardTitle>
                <CardDescription>Details for S/N: <span className="font-mono">{selectedSerialNumber}</span></CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1">
                <Image src={productInfo.imageUrl} alt={productInfo.name} width={400} height={400} className="rounded-lg border object-cover aspect-square" data-ai-hint={productInfo.type.toLowerCase().split(' ').slice(0, 2).join(' ')} />
              </div>
              <div className="sm:col-span-2 space-y-4">
                <h3 className="text-xl font-bold text-primary">{productInfo.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" /> <span>Type: <strong>{productInfo.type}</strong></span></div>
                  <div className="flex items-center gap-2"><Factory className="h-4 w-4 text-muted-foreground" /> <span>Manufacturer: <strong>{productInfo.manufacturer}</strong></span></div>
                  <div className="flex items-start gap-2"><Info className="h-4 w-4 text-muted-foreground mt-1" /> <span>Description: <p className="inline text-muted-foreground">{productInfo.description}</p></span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {fetchError}
            </AlertDescription>
            <div className="mt-4">
              <Button variant="secondary" onClick={handleManualReviewSubmit}>Submit for Manual Review</Button>
            </div>
          </Alert>
        )}
        
        {showManualReviewSuccess && (
           <Alert className="border-green-500 text-green-700 dark:border-green-600 dark:text-green-300">
            <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-200">Submitted!</AlertTitle>
            <AlertDescription>
              Serial number <span className="font-mono">{selectedSerialNumber}</span> has been sent for manual review. Thank you!
            </AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  );
}
