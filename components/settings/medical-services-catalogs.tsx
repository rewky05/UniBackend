'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Plus, Edit, Trash2, Stethoscope, TestTube, Scan, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { realDataService } from '@/lib/services/real-data.service';
import type { MedicalSpecialty, LabTest, ImagingTest, ConsultationType } from '@/lib/types/database';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface MedicalServicesCatalogsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

type ServiceItem = MedicalSpecialty | LabTest | ImagingTest | ConsultationType;



export function MedicalServicesCatalogs({ onUnsavedChanges }: MedicalServicesCatalogsProps) {
  const { toast } = useToast();
  const [specialties, setSpecialties] = useState<MedicalSpecialty[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [imagingTests, setImagingTests] = useState<ImagingTest[]>([]);
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [currentTab, setCurrentTab] = useState('specialties');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });
  
  // Confirmation dialog states
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string>('');
  const [deleteItemName, setDeleteItemName] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [specialtiesData, labTestsData, imagingTestsData, consultationTypesData] = await Promise.all([
          realDataService.getMedicalSpecialties(),
          realDataService.getLabTests(),
          realDataService.getImagingTests(),
          realDataService.getConsultationTypes()
        ]);
        
        setSpecialties(specialtiesData);
        setLabTests(labTestsData);
        setImagingTests(imagingTestsData);
        setConsultationTypes(consultationTypesData);
      } catch (error) {
        console.error('Error loading medical services data:', error);
        toast({
          title: "Error",
          description: "Failed to load medical services data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const getCurrentData = () => {
    switch (currentTab) {
      case 'specialties': return specialties;
      case 'lab-tests': return labTests;
      case 'imaging-tests': return imagingTests;
      case 'consultation-types': return consultationTypes;
      default: return [];
    }
  };

  const setCurrentData = (data: any[]) => {
    switch (currentTab) {
      case 'specialties': setSpecialties(data as MedicalSpecialty[]); break;
      case 'lab-tests': setLabTests(data as LabTest[]); break;
      case 'imaging-tests': setImagingTests(data as ImagingTest[]); break;
      case 'consultation-types': setConsultationTypes(data as ConsultationType[]); break;
    }
  };

  const getTabConfig = () => {
    const configs = {
             'specialties': {
         title: 'Medical Specialties',
         icon: Stethoscope,
         hasCategory: false,
         hasDescription: true
       },
      'lab-tests': {
        title: 'Laboratory Tests',
        icon: TestTube,
        hasCategory: false,
        hasDescription: true
      },
      'imaging-tests': {
        title: 'Imaging Tests',
        icon: Scan,
        hasCategory: false,
        hasDescription: true
      },
      'consultation-types': {
        title: 'Consultation Types',
        icon: MessageSquare,
        hasCategory: false,
        hasDescription: true
      }
    };
    return configs[currentTab as keyof typeof configs];
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', category: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ServiceItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: 'description' in item ? (item as any).description || '' : '',
      category: 'category' in item ? (item as any).category || '' : ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const currentData = getCurrentData();
    
    if (editingItem) {
      const updatedData = currentData.map(item =>
        item.id === editingItem.id
          ? { ...item, ...formData }
          : item
      );
      setCurrentData(updatedData);
      toast({
        title: "Item updated",
        description: "The item has been updated successfully.",
        variant: "default",
      });
    } else {
             const newItem: ServiceItem = {
         id: Date.now().toString(),
         ...formData
       };
      setCurrentData([...currentData, newItem]);
      toast({
        title: "Item added",
        description: "New item has been added successfully.",
      });
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = (itemId: string | undefined, itemName: string) => {
    if (!itemId) return;
    
    setDeleteItemId(itemId);
    setDeleteItemName(itemName);
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    
    setActionLoading(true);
    try {
      const currentData = getCurrentData();
      const updatedData = currentData.filter(item => item.id !== deleteItemId);
      setCurrentData(updatedData);
      
      toast({
        title: "Item deleted",
        description: "The item has been removed successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };



  // Helper function to convert plural to singular
  const toSingular = (plural: string): string => {
    if (plural.endsWith('ies')) {
      return plural.slice(0, -3) + 'y'; // specialties -> specialty
    } else if (plural.endsWith('s')) {
      return plural.slice(0, -1); // tests -> test
    }
    return plural; // fallback
  };

  const tabConfig = getTabConfig();

  if (loading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Medical Services & Catalogs
          </CardTitle>
          <CardDescription>
            Manage predefined lists of medical specialties, tests, and consultation types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading medical services...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Medical Services & Catalogs
        </CardTitle>
        <CardDescription>
          Manage predefined lists of medical specialties, tests, and consultation types.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="specialties">Specialties</TabsTrigger>
            {/* <TabsTrigger value="lab-tests">Lab Tests</TabsTrigger>
            <TabsTrigger value="imaging-tests">Imaging</TabsTrigger> */}
            <TabsTrigger value="consultation-types">Consultations</TabsTrigger>
          </TabsList>

          {['specialties', 'consultation-types'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <tabConfig.icon className="h-5 w-5" />
                  <h3 className="text-lg font-medium">
                    {tabConfig.title} ({getCurrentData().length})
                  </h3>
                </div>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New {toSingular(tabConfig.title)}
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                                         <TableRow>
                       <TableHead>Name</TableHead>
                       {tabConfig.hasDescription && <TableHead>Description</TableHead>}
                       <TableHead className="w-[100px]">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                                         {getCurrentData().map((item) => (
                       <TableRow key={item.id}>
                         <TableCell className="font-medium">{item.name}</TableCell>
                         {tabConfig.hasDescription && (
                           <TableCell>
                             {'description' in item && (item as any).description}
                           </TableCell>
                         )}
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id, item.name)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? `Edit ${toSingular(tabConfig.title)}` : `Add New ${toSingular(tabConfig.title)}`}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update the item information.' : 'Create a new item in the catalog.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
                             {tabConfig.hasDescription && (
                 <div className="space-y-2">
                   <Label htmlFor="description">Description</Label>
                   <Textarea
                     id="description"
                     placeholder="Enter description"
                     value={formData.description}
                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                     rows={3}
                   />
                 </div>
               )}
              
              {tabConfig.hasCategory && (
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Enter category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
                             <Button 
                 onClick={handleSave}
                 disabled={!formData.name || (tabConfig.hasDescription && !formData.description)}
               >
                {editingItem ? 'Update' : 'Add'} {toSingular(tabConfig.title)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialog}
          onOpenChange={setDeleteDialog}
          title="Delete Item"
          description={`Are you sure you want to delete "${deleteItemName}"? This action cannot be undone.`}
          confirmText="Delete Item"
          cancelText="Cancel"
          variant="destructive"
          loading={actionLoading}
          onConfirm={confirmDelete}
        />
      </CardContent>
    </Card>
  );
}