import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useMobileOptimization } from '@/hooks/useEnhancedUX';

interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  hiddenOnMobile?: boolean;
}

interface Action<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive';
  hidden?: (row: T) => boolean;
}

interface ResponsiveDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  loading?: boolean;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
  showPagination?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
}

export function ResponsiveDataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  pageSize = 10,
  className,
  emptyMessage = "No data available",
  showPagination = true,
  selectable = false,
  onSelectionChange
}: ResponsiveDataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const { isMobile } = useMobileOptimization();

  const visibleColumns = useMemo(() => 
    columns.filter(col => !isMobile || !col.hiddenOnMobile),
    [columns, isMobile]
  );

  const paginatedData = useMemo(() => {
    if (!showPagination) return data;
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(data.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSelectRow = (index: number) => {
    if (!selectable) return;
    
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRows(newSelection);
    
    if (onSelectionChange) {
      const selectedData = Array.from(newSelection).map(i => paginatedData[i]);
      onSelectionChange(selectedData);
    }
  };

  const handleSelectAll = () => {
    if (!selectable) return;
    
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const allIndices = new Set(paginatedData.map((_, i) => i));
      setSelectedRows(allIndices);
      onSelectionChange?.(paginatedData);
    }
  };

  const getCellValue = (row: T, column: Column<T>) => {
    const key = column.key as string;
    if (key.includes('.')) {
      return key.split('.').reduce((obj, k) => obj?.[k], row);
    }
    return row[key];
  };

  const renderLoadingSkeleton = () => (
    <TableBody>
      {Array.from({ length: pageSize }).map((_, index) => (
        <TableRow key={index}>
          {selectable && (
            <TableCell>
              <Skeleton className="h-4 w-4" />
            </TableCell>
          )}
          {visibleColumns.map((column, colIndex) => (
            <TableCell key={colIndex} className={column.className}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
          {actions.length > 0 && (
            <TableCell>
              <Skeleton className="h-8 w-8" />
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  );

  const renderMobileCard = (row: T, index: number) => {
    const visibleActions = actions.filter(action => !action.hidden?.(row));
    
    return (
      <Card key={index} className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-2">
            {visibleColumns.map((column, colIndex) => {
              const value = getCellValue(row, column);
              return (
                <div key={colIndex} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    {column.header}:
                  </span>
                  <span className="text-sm">
                    {column.cell ? column.cell(value, row) : String(value)}
                  </span>
                </div>
              );
            })}
            
            {visibleActions.length > 0 && (
              <div className="flex justify-end gap-2 pt-2 border-t">
                {visibleActions.map((action, actionIndex) => (
                  <Button
                    key={actionIndex}
                    size="sm"
                    variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                    onClick={() => action.onClick(row)}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {isMobile ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && <TableHead className="w-12" />}
                {visibleColumns.map((column, index) => (
                  <TableHead key={index} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
                {actions.length > 0 && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            {renderLoadingSkeleton()}
          </Table>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        {paginatedData.map((row, index) => renderMobileCard(row, index))}
        
        {showPagination && totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-input"
                />
              </TableHead>
            )}
            {visibleColumns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {actions.length > 0 && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {paginatedData.map((row, index) => {
            const visibleActions = actions.filter(action => !action.hidden?.(row));
            
            return (
              <TableRow 
                key={index}
                className={selectedRows.has(index) ? "bg-muted/50" : ""}
              >
                {selectable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(index)}
                      onChange={() => handleSelectRow(index)}
                      className="rounded border-input"
                    />
                  </TableCell>
                )}
                {visibleColumns.map((column, colIndex) => {
                  const value = getCellValue(row, column);
                  return (
                    <TableCell key={colIndex} className={column.className}>
                      {column.cell ? column.cell(value, row) : String(value)}
                    </TableCell>
                  );
                })}
                {actions.length > 0 && (
                  <TableCell>
                    {visibleActions.length === 1 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => visibleActions[0].onClick(row)}
                      >
                        {visibleActions[0].icon}
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {visibleActions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={() => action.onClick(row)}
                              className={action.variant === 'destructive' ? "text-destructive" : ""}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data.length)} of {data.length} results
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="flex items-center gap-1 px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}