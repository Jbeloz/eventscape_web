import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView,
  Dimensions,
  ActivityIndicator
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from 'react-native-chart-kit';
import { Palette } from "../../../assets/colors/palette";
import { Fonts } from "../../../assets/fonts/fonts";
import AdminHeader from "../../components/admin-header";
import AdminSidebar from "../../components/admin-sidebar";
import { Theme } from "../../../constants/theme";

interface DashboardProps {
  navigation?: any;
}

interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  userGrowth: number;
  bookingGrowth: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: number;
  type: 'booking' | 'event' | 'user' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

interface TopEvent {
  id: number;
  name: string;
  bookings: number;
  revenue: number;
  growth: number;
}

// Mock user data
const currentUser = {
  name: "Alex Johnson",
  role: "Administrator"
};

// Use ONLY colors that exist in your Palette
const userTypeDistribution = [
  { type: 'Regular Users', count: 150, color: Palette.blue },
  { type: 'Event Organizers', count: 65, color: Palette.green },
  { type: 'Venue Owners', count: 35, color: Palette.primary },
  { type: 'Administrators', count: 8, color: Palette.red },
];

export default function AdminHome({ navigation }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalEvents: 0,
    totalBookings: 0,
    totalRevenue: 0,
    userGrowth: 0,
    bookingGrowth: 0,
    revenueGrowth: 0,
  });
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API calls
      const mockStats: DashboardStats = {
        totalUsers: 1245,
        totalEvents: 48,
        totalBookings: 892,
        totalRevenue: 45678.90,
        userGrowth: 12.5,
        bookingGrowth: 8.2,
        revenueGrowth: 15.7,
      };

      const mockActivity: RecentActivity[] = [
        { id: 1, type: 'booking', title: 'New Booking', description: 'John booked "Summer Music Festival"', timestamp: '10 min ago', amount: 199.99 },
        { id: 2, type: 'user', title: 'New User', description: 'Sarah Johnson registered', timestamp: '25 min ago' },
        { id: 3, type: 'payment', title: 'Payment Received', description: 'Payment confirmed for #BKG-7890', timestamp: '1 hour ago', amount: 299.99 },
        { id: 4, type: 'event', title: 'Event Created', description: 'New event "Winter Gala" added', timestamp: '2 hours ago' },
        { id: 5, type: 'booking', title: 'Booking Cancelled', description: '#BKG-4567 was cancelled', timestamp: '3 hours ago', amount: -149.99 },
      ];

      const mockTopEvents: TopEvent[] = [
        { id: 1, name: 'Summer Music Festival', bookings: 245, revenue: 24500, growth: 25 },
        { id: 2, name: 'Tech Conference 2024', bookings: 189, revenue: 56700, growth: 18 },
        { id: 3, name: 'Food & Wine Expo', bookings: 156, revenue: 31200, growth: 12 },
        { id: 4, name: 'Art Gallery Opening', bookings: 98, revenue: 14700, growth: 8 },
        { id: 5, name: 'Yoga Retreat', bookings: 76, revenue: 15200, growth: 15 },
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
      setTopEvents(mockTopEvents);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = (section: string) => {
    console.log(`View All clicked for: ${section}`);
    // Navigate to respective sections
    // Example: navigation.navigate('UsersList') or navigation.navigate('EventsList')
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? Palette.green : Palette.red;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? 'trending-up' : 'trending-down';
  };

  const renderStatCard = (
    icon: string,
    title: string,
    value: number | string,
    growth: number,
    color: string,
    iconType: 'ionicons' | 'material' = 'ionicons'
  ) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
          {iconType === 'ionicons' ? (
            <Ionicons name={icon as any} size={20} color={color} />
          ) : (
            <MaterialCommunityIcons name={icon as any} size={20} color={color} />
          )}
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>
        {typeof value === 'number' && value >= 1000 
          ? `${(value / 1000).toFixed(1)}k` 
          : typeof value === 'number' 
            ? value.toLocaleString() 
            : value}
      </Text>
      <View style={styles.statGrowth}>
        <Ionicons 
          name={getGrowthIcon(growth)} 
          size={14} 
          color={getGrowthColor(growth)} 
        />
        <Text style={[styles.growthText, { color: getGrowthColor(growth) }]}>
          {growth >= 0 ? '+' : ''}{growth}%
        </Text>
        <Text style={styles.growthPeriod}> from last period</Text>
      </View>
    </View>
  );

  const renderActivityIcon = (type: string) => {
    const icons = {
      booking: { name: 'calendar-outline', type: 'ionicons' as const },
      event: { name: 'festival', type: 'material' as const },
      user: { name: 'account-plus', type: 'material' as const },
      payment: { name: 'cash-outline', type: 'ionicons' as const },
    };
    
    const colors = {
      booking: Palette.blue,
      event: '#8b5cf6',
      user: Palette.green,
      payment: '#f59e0b',
    };
    
    const iconData = icons[type as keyof typeof icons];
    
    return (
      <View style={[styles.activityIcon, { backgroundColor: `${colors[type as keyof typeof colors]}15` }]}>
        {iconData.type === 'ionicons' ? (
          <Ionicons 
            name={iconData.name as any} 
            size={16} 
            color={colors[type as keyof typeof colors]} 
          />
        ) : (
          <MaterialCommunityIcons 
            name={iconData.name as any} 
            size={16} 
            color={colors[type as keyof typeof colors]} 
          />
        )}
      </View>
    );
  };

  // Simple donut chart component
  const renderDonutChart = () => {
    const totalUsers = userTypeDistribution.reduce((sum, item) => sum + item.count, 0);
    
    return (
      <View style={styles.donutContainer}>
        <Text style={[styles.chartTitle, { color: Theme.colors.text, fontFamily: Theme.fonts.semibold }]}>
          User Type Distribution
        </Text>
        <View style={styles.donutContent}>
          <View style={styles.donutChart}>
            <View style={styles.donutInner}>
              <Text style={[styles.donutTotal, { color: Theme.colors.text }]}>{totalUsers}</Text>
              <Text style={[styles.donutLabel, { color: Theme.colors.muted }]}>Total</Text>
            </View>
          </View>
          <View style={styles.donutLegend}>
            {userTypeDistribution.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <View style={styles.legendText}>
                  <Text style={[styles.legendLabel, { color: Theme.colors.text }]}>{item.type}</Text>
                  <Text style={[styles.legendValue, { color: Theme.colors.muted }]}>
                    {item.count} ({Math.round((item.count / totalUsers) * 100)}%)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <AdminHeader
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <View style={styles.mainContainer}>
        {/* Sidebar - Based on your existing code, it uses isOpen prop */}
        <AdminSidebar 
          isOpen={sidebarOpen} 
          isDarkMode={false}
        />

        {/* Main Content */}
        <ScrollView style={[styles.content, { backgroundColor: Theme.colors.background }]}>
          {/* Welcome Banner */}
          <View style={[styles.welcomeBanner, { 
            backgroundColor: Theme.colors.background,
            borderWidth: 1,
            borderColor: Theme.colors.border 
          }]}>
            <Ionicons name="information-circle" size={24} color={Palette.primary} />
            <Text style={[styles.welcomeText, { color: Theme.colors.text }]}>
              Welcome back, {currentUser.name}!
            </Text>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.pageTitle, { color: Theme.colors.text }]}>Dashboard Overview</Text>
            <View style={styles.timeRangeSelector}>
              {(['week', 'month', 'year'] as const).map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.timeRangeButton,
                    timeRange === range && styles.timeRangeButtonActive
                  ]}
                  onPress={() => setTimeRange(range)}
                >
                  <Text style={[
                    styles.timeRangeText,
                    timeRange === range && styles.timeRangeTextActive
                  ]}>
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats Overview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => handleViewAll('overview')}
              >
                <Text style={styles.viewAllText}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color={Palette.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsGrid}>
              {renderStatCard('people', 'Total Users', stats.totalUsers, stats.userGrowth, Palette.blue)}
              {renderStatCard('calendar', 'Total Events', stats.totalEvents, 0, '#8b5cf6')}
              {renderStatCard('bookmark', 'Total Bookings', stats.totalBookings, stats.bookingGrowth, Palette.green, 'material')}
              {renderStatCard('cash', 'Total Revenue', `₱${stats.totalRevenue.toLocaleString()}`, stats.revenueGrowth, '#f59e0b')}
            </View>
          </View>

          {/* Revenue Chart */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Revenue Trend</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => handleViewAll('revenue')}
              >
                <Text style={styles.viewAllText}>View Report</Text>
                <Ionicons name="arrow-forward" size={16} color={Palette.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    data: [
                      Math.random() * 100,
                      Math.random() * 100,
                      Math.random() * 100,
                      Math.random() * 100,
                      Math.random() * 100,
                      Math.random() * 100
                    ]
                  }]
                }}
                width={Dimensions.get('window').width - 80}
                height={220}
                chartConfig={{
                  backgroundColor: Palette.white,
                  backgroundGradientFrom: Palette.white,
                  backgroundGradientTo: Palette.white,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 184, 28, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: Palette.primary
                  }
                }}
                bezier
                style={styles.chart}
              />
            </View>
          </View>

          {/* Top Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Events</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => handleViewAll('events')}
              >
                <Text style={styles.viewAllText}>View All Events</Text>
                <Ionicons name="arrow-forward" size={16} color={Palette.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.eventsList}>
              {topEvents.map((event, index) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventRank}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventName, { color: Palette.black }]}>{event.name}</Text>
                    <View style={styles.eventStats}>
                      <View style={styles.eventStat}>
                        <Ionicons name="people" size={12} color={Palette.gray700} />
                        <Text style={[styles.eventStatText, { color: Palette.gray700 }]}>{event.bookings} bookings</Text>
                      </View>
                      <View style={styles.eventStat}>
                        <Ionicons name="cash" size={12} color={Palette.gray700} />
                        <Text style={[styles.eventStatText, { color: Palette.gray700 }]}>₱{event.revenue.toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.eventGrowth}>
                    <Ionicons 
                      name={getGrowthIcon(event.growth)} 
                      size={14} 
                      color={getGrowthColor(event.growth)} 
                    />
                    <Text style={[styles.eventGrowthText, { color: getGrowthColor(event.growth) }]}>
                      {event.growth}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* User Distribution and Quick Stats */}
          <View style={styles.rowSection}>
            <View style={[styles.halfSection, { marginRight: 8 }]}>
              {renderDonutChart()}
            </View>
            
            <View style={[styles.halfSection, { marginLeft: 8 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Stats</Text>
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => handleViewAll('stats')}
                >
                  <Text style={styles.viewAllText}>View Analytics</Text>
                  <Ionicons name="arrow-forward" size={16} color={Palette.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.quickStatsGrid}>
                <View style={styles.quickStat}>
                  <Ionicons name="time" size={24} color={Palette.primary} />
                  <Text style={styles.quickStatValue}>24</Text>
                  <Text style={[styles.quickStatLabel, { color: Palette.black }]}>Pending Approvals</Text>
                </View>
                
                <View style={styles.quickStat}>
                  <Ionicons name="alert-circle" size={24} color="#f59e0b" />
                  <Text style={styles.quickStatValue}>8</Text>
                  <Text style={[styles.quickStatLabel, { color: Palette.black }]}>Issues Today</Text>
                </View>
                
                <View style={styles.quickStat}>
                  <Ionicons name="chatbubbles" size={24} color={Palette.green} />
                  <Text style={styles.quickStatValue}>42</Text>
                  <Text style={[styles.quickStatLabel, { color: Palette.black }]}>New Messages</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: Palette.black }]}>Recent Activity</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => handleViewAll('activity')}
              >
                <Text style={styles.viewAllText}>View All Activity</Text>
                <Ionicons name="arrow-forward" size={16} color={Palette.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.activityList}>
              {recentActivity.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  {renderActivityIcon(activity.type)}
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>{activity.timestamp}</Text>
                  </View>
                  {activity.amount && (
                    <Text style={[
                      styles.activityAmount,
                      { color: activity.amount >= 0 ? Palette.green : Palette.red }
                    ]}>
                      {activity.amount >= 0 ? '+' : ''}₱{Math.abs(activity.amount).toFixed(2)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.light.lightBg,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Palette.gray500,
  },
  welcomeBanner: {
    flexDirection: "row",
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  welcomeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.fonts.medium,
  },
  titleSection: {
    marginBottom: Theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: Theme.fonts.bold,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: Palette.lightGray,
    borderRadius: 8,
    padding: 4,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: Palette.white,
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Palette.gray500,
  },
  timeRangeTextActive: {
    color: Palette.primary,
  },
  section: {
    marginBottom: 16,
    backgroundColor: Palette.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  rowSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  halfSection: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Palette.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Palette.primary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: Palette.gray100,
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTitle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Palette.gray700,
    flex: 1,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Palette.primary,
    marginBottom: 4,
  },
  statGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
  },
  growthPeriod: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Palette.gray500,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  eventsList: {
    gap: 8,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.gray100,
    borderRadius: 8,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  eventRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.lightYellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.primary,
  },
  rankText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Palette.primary,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    marginBottom: 4,
  },
  eventStats: {
    flexDirection: 'row',
    gap: 12,
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventStatText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  eventGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventGrowthText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray100,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Palette.primary,
    marginBottom: 2,
  },
  activityDescription: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Palette.gray500,
    marginBottom: 2,
  },
  activityTime: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Palette.gray700,
  },
  activityAmount: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  quickStatsGrid: {
    gap: 12,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Palette.gray100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 12,
  },
  quickStatValue: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Palette.primary,
    flex: 1,
  },
  quickStatLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    flex: 2,
  },
  donutContainer: {
    flex: 1,
  },
  donutContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  donutChart: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 8,
    borderColor: Palette.primary,
    marginRight: Theme.spacing.lg,
  },
  donutInner: {
    alignItems: "center",
  },
  donutTotal: {
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  donutLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  donutLegend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  legendValue: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  chartTitle: {
    fontSize: 16,
    marginBottom: Theme.spacing.lg,
  },
});