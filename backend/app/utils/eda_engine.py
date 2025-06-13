import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.utils import PlotlyJSONEncoder
import base64
import io
import json
import tempfile
import os
from ydata_profiling import ProfileReport

class EDAEngine:
    def __init__(self, dataframe):
        self.df = dataframe
        self.numerical_columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_columns = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    def convert_numpy_types(self, obj):
        """Convert numpy types to native Python types for JSON serialization"""
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {key: self.convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_numpy_types(item) for item in obj]
        elif isinstance(obj, tuple):
            return tuple(self.convert_numpy_types(item) for item in obj)
        elif pd.isna(obj):
            return None
        else:
            return obj
    
    def get_basic_info(self):
        """Get basic dataset information"""
        info = {
            "shape": list(self.df.shape),
            "columns": self.df.columns.tolist(),
            "dtypes": {col: str(dtype) for col, dtype in self.df.dtypes.items()},
            "numerical_columns": self.numerical_columns,
            "categorical_columns": self.categorical_columns
        }
        return self.convert_numpy_types(info)
    
    def get_missing_values(self):
        """Get missing values information"""
        missing_values = self.df.isnull().sum()
        missing_percentage = (missing_values / len(self.df)) * 100
        
        info = {
            "missing_counts": missing_values.to_dict(),
            "missing_percentages": missing_percentage.to_dict(),
            "total_missing": int(missing_values.sum())
        }
        return self.convert_numpy_types(info)
    
    def get_descriptive_stats(self):
        """Get descriptive statistics"""
        stats = {}
        
        # Numerical columns
        if self.numerical_columns:
            numerical_stats = self.df[self.numerical_columns].describe()
            stats["numerical"] = {}
            for col in numerical_stats.columns:
                stats["numerical"][col] = {}
                for stat in numerical_stats.index:
                    value = numerical_stats.loc[stat, col]
                    if pd.isna(value):
                        stats["numerical"][col][stat] = None
                    else:
                        stats["numerical"][col][stat] = float(value)
        
        # Categorical columns
        if self.categorical_columns:
            cat_stats = {}
            for col in self.categorical_columns:
                try:
                    unique_count = self.df[col].nunique()
                    top_values = self.df[col].value_counts().head(5)
                    
                    cat_stats[col] = {
                        "unique_count": int(unique_count),
                        "top_values": {str(k): int(v) for k, v in top_values.items()}
                    }
                except Exception as e:
                    cat_stats[col] = {
                        "unique_count": 0,
                        "top_values": {},
                        "error": str(e)
                    }
            stats["categorical"] = cat_stats
        
        return self.convert_numpy_types(stats)
    
    def get_correlation_matrix(self):
        """Get correlation matrix for numerical columns"""
        if len(self.numerical_columns) > 1:
            try:
                corr_matrix = self.df[self.numerical_columns].corr()
                # Convert to regular dict with proper handling of NaN values
                corr_dict = {}
                for col1 in corr_matrix.columns:
                    corr_dict[col1] = {}
                    for col2 in corr_matrix.index:
                        value = corr_matrix.loc[col2, col1]
                        if pd.isna(value):
                            corr_dict[col1][col2] = None
                        else:
                            corr_dict[col1][col2] = float(value)
                return corr_dict
            except Exception as e:
                return {"error": str(e)}
        return {}
    
    def generate_missing_values_chart(self):
        """Generate missing values bar chart"""
        try:
            missing_data = self.df.isnull().sum()
            missing_data = missing_data[missing_data > 0].sort_values(ascending=False)
            
            if len(missing_data) == 0:
                return None
            
            fig = px.bar(
                x=missing_data.index.tolist(),
                y=missing_data.values.tolist(),
                title="Missing Values by Column",
                labels={"x": "Columns", "y": "Missing Count"}
            )
            
            return json.dumps(fig, cls=PlotlyJSONEncoder)
        except Exception as e:
            return None
    
    def generate_histograms(self):
        """Generate histograms for numerical columns"""
        histograms = {}
        
        try:
            for col in self.numerical_columns[:6]:  # Limit to first 6 columns
                # Remove any infinite values and NaN
                clean_data = self.df[col].replace([np.inf, -np.inf], np.nan).dropna()
                
                if len(clean_data) > 0:
                    fig = px.histogram(
                        x=clean_data.values,
                        title=f"Distribution of {col}",
                        nbins=min(30, len(clean_data.unique())),
                        labels={"x": col, "y": "Count"}
                    )
                    histograms[col] = json.dumps(fig, cls=PlotlyJSONEncoder)
        except Exception as e:
            pass
        
        return histograms
    
    def generate_categorical_charts(self):
        """Generate bar charts for categorical columns"""
        categorical_charts = {}
        
        try:
            for col in self.categorical_columns[:6]:  # Limit to first 6 columns
                value_counts = self.df[col].value_counts().head(10)
                
                if len(value_counts) > 0:
                    fig = px.bar(
                        x=value_counts.index.tolist(),
                        y=value_counts.values.tolist(),
                        title=f"Distribution of {col}",
                        labels={"x": col, "y": "Count"}
                    )
                    
                    categorical_charts[col] = json.dumps(fig, cls=PlotlyJSONEncoder)
        except Exception as e:
            pass
        
        return categorical_charts
    
    def generate_boxplots(self):
        """Generate boxplots for numerical columns"""
        boxplots = {}
        
        try:
            for col in self.numerical_columns[:6]:  # Limit to first 6 columns
                # Remove any infinite values and NaN
                clean_data = self.df[col].replace([np.inf, -np.inf], np.nan).dropna()
                
                if len(clean_data) > 0:
                    fig = px.box(
                        y=clean_data.values,
                        title=f"Boxplot of {col}",
                        labels={"y": col}
                    )
                    boxplots[col] = json.dumps(fig, cls=PlotlyJSONEncoder)
        except Exception as e:
            pass
        
        return boxplots
    
    def generate_correlation_heatmap(self):
        """Generate correlation heatmap"""
        try:
            if len(self.numerical_columns) > 1:
                # Clean the data before correlation
                clean_df = self.df[self.numerical_columns].replace([np.inf, -np.inf], np.nan)
                corr_matrix = clean_df.corr()
                
                fig = px.imshow(
                    corr_matrix.values,
                    x=corr_matrix.columns.tolist(),
                    y=corr_matrix.index.tolist(),
                    title="Correlation Matrix Heatmap",
                    color_continuous_scale="RdBu",
                    aspect="auto",
                    text_auto=True
                )
                
                return json.dumps(fig, cls=PlotlyJSONEncoder)
        except Exception as e:
            pass
        
        return None
    
    def generate_pie_charts(self):
        """Generate pie charts for categorical columns"""
        pie_charts = {}
        
        try:
            for col in self.categorical_columns[:4]:  # Limit to first 4 columns
                value_counts = self.df[col].value_counts().head(8)
                
                if len(value_counts) > 0:
                    fig = px.pie(
                        values=value_counts.values.tolist(),
                        names=value_counts.index.tolist(),
                        title=f"Distribution of {col}"
                    )
                    
                    pie_charts[col] = json.dumps(fig, cls=PlotlyJSONEncoder)
        except Exception as e:
            pass
        
        return pie_charts
    
    def generate_analysis(self):
        """Generate complete EDA analysis"""
        try:
            analysis = {
                "basic_info": self.get_basic_info(),
                "missing_values": self.get_missing_values(),
                "descriptive_stats": self.get_descriptive_stats(),
                "correlation_matrix": self.get_correlation_matrix(),
                "visualizations": {
                    "missing_values_chart": self.generate_missing_values_chart(),
                    "histograms": self.generate_histograms(),
                    "categorical_charts": self.generate_categorical_charts(),
                    "boxplots": self.generate_boxplots(),
                    "correlation_heatmap": self.generate_correlation_heatmap(),
                    "pie_charts": self.generate_pie_charts()
                }
            }
            
            return self.convert_numpy_types(analysis)
        except Exception as e:
            raise Exception(f"Error generating analysis: {str(e)}")
    
    def generate_html_report(self):
        """Generate comprehensive HTML report using ydata-profiling"""
        try:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.html')
            temp_path = temp_file.name
            temp_file.close()
            
            # Generate profile report with minimal configuration to avoid errors
            profile = ProfileReport(
                self.df,
                title="Automated EDA Report",
                explorative=True,
                minimal=True,  # Use minimal mode to avoid complex calculations
                samples={"head": 5, "tail": 5}  # Limit samples
            )
            
            # Save report
            profile.to_file(temp_path)
            
            return temp_path
            
        except Exception as e:
            raise Exception(f"Error generating HTML report: {str(e)}")