'use server';
import { generateHelpText as genHelp, GenerateHelpTextInput, GenerateHelpTextOutput } from '@/ai/flows/ai-powered-help';
import { extractSerialNumber as extractSN, ExtractSerialNumberInput, ExtractSerialNumberOutput } from '@/ai/flows/extract-serial-number';
import { z } from 'zod';

export async function generateHelpText(input: GenerateHelpTextInput): Promise<GenerateHelpTextOutput> {
    return genHelp(input);
}

export async function extractSerialNumber(input: ExtractSerialNumberInput): Promise<ExtractSerialNumberOutput> {
    return extractSN(input);
}

// Mock Product Info Logic
interface Product {
    id: string;
    name: string;
    type: string;
    manufacturer: string;
    description: string;
    imageUrl: string;
}

const mockProducts: Record<string, Product> = {
    'SN12345XYZ': {
        id: 'PROD-001',
        name: 'QuantumCore X1 Motherboard',
        type: 'ATX Motherboard',
        manufacturer: 'Innovatech Inc.',
        description: 'A high-performance motherboard for gaming and professional workstations, featuring the latest chipset and connectivity options.',
        imageUrl: 'https://placehold.co/400x400.png'
    },
    'MB67890ABC': {
        id: 'PROD-002',
        name: 'NanoWeave P5-Lite PCA',
        type: 'Printed Circuit Assembly',
        manufacturer: 'Component Solutions',
        description: 'A compact and efficient PCBA designed for IoT devices and small form-factor electronics.',
        imageUrl: 'https://placehold.co/400x400.png'
    },
    'A7B8C9D0E1': {
        id: 'PROD-003',
        name: 'Hyperion Z-9 Chipset',
        type: 'Processor Component',
        manufacturer: 'Silicon Dynasties',
        description: 'Next-generation processing unit for embedded systems, offering unparalleled speed and low power consumption.',
        imageUrl: 'https://placehold.co/400x400.png'
    }
};

const FetchProductInput = z.object({
    serialNumber: z.string(),
});

export async function fetchProductInfo(input: z.infer<typeof FetchProductInput>): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    
    const product = mockProducts[input.serialNumber];
    
    if (product) {
        return product;
    }

    throw new Error('Product not found for this serial number.');
}
